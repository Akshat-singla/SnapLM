import typer
import httpx
import json
import os
from pathlib import Path
from rich import print
from rich.tree import Tree
from rich.console import Console
from rich.panel import Panel

app = typer.Typer()
console = Console()

BASE_URL = "http://localhost:3500/api/v1"
DEV_BASE = "http://localhost:3500/dev"

AUTH_FILE = Path.home() / ".branching_cli_auth.json"


# =====================================================
# AUTH UTILITIES
# =====================================================

def save_token(token: str):
    AUTH_FILE.write_text(json.dumps({"access_token": token}))


def load_token():
    if not AUTH_FILE.exists():
        return None
    return json.loads(AUTH_FILE.read_text()).get("access_token")


def clear_token():
    if AUTH_FILE.exists():
        AUTH_FILE.unlink()


def get_headers():
    token = load_token()
    if not token:
        return {}
    return {"Authorization": f"Bearer {token}"}


def request(method, url, **kwargs):
    headers = get_headers()
    kwargs["headers"] = {**headers, **kwargs.get("headers", {})}

    with httpx.Client(timeout=99999999) as client:
        response = client.request(method, url, **kwargs)

        if response.status_code == 401:
            print("[red]Unauthorized. Please login.[/red]")
            raise typer.Exit()

        if response.status_code >= 400:
            print(f"[red]Error:[/red] {response.text}")
            raise typer.Exit()

        return response.json()


# =====================================================
# AUTH COMMANDS
# =====================================================

@app.command()
def signup(email: str, password: str):
    """Create a new user account"""
    data = request(
        "POST",
        f"{BASE_URL}/users",
        json={"email": email, "password": password}
    )

    print("[green]Signup successful![/green]")
    print(data)


@app.command()
def login(email: str, password: str):
    """Login and store JWT token"""
    with httpx.Client(timeout=999999999) as client:
        response = client.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password}
        )

        if response.status_code >= 400:
            print(f"[red]Login failed:[/red] {response.text}")
            raise typer.Exit()

        data = response.json()
        token = data.get("access_token")

        if not token:
            print("[red]No access token received[/red]")
            raise typer.Exit()

        save_token(token)

    print("[green]Login successful![/green]")


@app.command()
def logout():
    """Remove stored token"""
    clear_token()
    print("[yellow]Logged out.[/yellow]")


@app.command()
def whoami():
    """Check current authenticated user"""
    data = request("GET", f"{BASE_URL}/auth/me")
    console.print(Panel(json.dumps(data, indent=2), title="Current User"))


# =====================================================
# TREE VIEW
# =====================================================

def build_tree(node):
    branch = Tree(f"[bold]{node['title']}[/bold] ({node['node_id']})")
    for child in node.get("children", []):
        branch.add(build_tree(child))
    return branch


@app.command()
def tree():
    data = request("GET", f"{BASE_URL}/nodes/tree")
    for root in data:
        console.print(build_tree(root))


# =====================================================
# NODE COMMANDS
# =====================================================

@app.command()
def create(title: str, parent_id: str = None):
    payload = {
        "title": title,
        "node_type": "standard"
    }

    if parent_id:
        payload["parent_id"] = parent_id

    data = request("POST", f"{BASE_URL}/nodes", json=payload)
    print(f"[green]Created node:[/green] {data['node_id']}")


@app.command()
def chat(node_id: str, message: str):
    data = request(
        "POST",
        f"{BASE_URL}/nodes/{node_id}/messages",
        json={"content": message}
    )

    console.print(Panel(data["content"], title="Assistant Response"))


@app.command()
def summarize(node_id: str):
    data = request("POST", f"{BASE_URL}/nodes/{node_id}/summarize")

    console.print(Panel(
        json.dumps(data["summary"], indent=2),
        title="Summary"
    ))


@app.command()
def context(node_id: str):
    data = request("GET", f"{BASE_URL}/nodes/{node_id}/context")

    console.print(Panel(
        json.dumps(data, indent=2),
        title="Inherited Context"
    ))


@app.command()
def chat_context(node_id: str):
    data = request("GET", f"{DEV_BASE}/nodes/{node_id}/chat-context")

    console.print(Panel(
        data["system_prompt"],
        title="System Prompt"
    ))


@app.command()
def merge(source: str, target: str):
    data = request(
        "POST",
        f"{BASE_URL}/nodes/merge",
        json={
            "source_node_id": source,
            "target_node_id": target
        }
    )

    console.print(Panel(
        json.dumps(data["updated_summary"], indent=2),
        title="Updated Target Summary"
    ))


@app.command()
def graph(node_id: str):
    data = request("GET", f"{BASE_URL}/nodes/{node_id}/graph")

    console.print(Panel(
        json.dumps(data, indent=2),
        title="Knowledge Graph"
    ))


@app.command()
def delete(node_id: str):
    request(
        "POST",
        f"{BASE_URL}/nodes/{node_id}/delete",
        json={"cascade": False}
    )

    print(f"[red]Deleted node {node_id}[/red]")


# =====================================================
# ENTRY
# =====================================================

if __name__ == "__main__":
    app()