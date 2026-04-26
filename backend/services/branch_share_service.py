"""Serialized branch subgraph for sharing (path + subtree, not full canvas).

Traversal shape:
1) Ancestor chain from project root -> selected node, following ``parent_id`` upward.
2) Descendants of selected node, following ``parent_id`` downward (BFS).

Final node set = ancestor chain U selected subtree.

Merge edges (``merge_parent_id``) are exported only when both endpoints are inside
the final node set, so unrelated merge targets remain excluded.

Output shape stored in ``shared_projects.graph_data``::

    { "nodes": [...], "edges": [...], "messages": { node_id: [...] }, "meta": {...} }
"""

from __future__ import annotations

import uuid
from typing import Any

from crud.messages import get_messages as crud_get_messages
from crud.nodes import get_node
from models.db_models import Node
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def collect_branch_nodes(
    session: AsyncSession, root_node_id: uuid.UUID
) -> list[Any] | None:
    """Root plus all descendants along parent edges, excluding deleted nodes."""
    root = await get_node(session, root_node_id)
    if not root or root.status == "deleted":
        return None

    collected: list[Any] = [root]
    seen = {root.node_id}
    queue = [root.node_id]

    while queue:
        parent_id = queue.pop(0)
        result = await session.execute(
            select(Node).where(
                Node.parent_id == parent_id,
                Node.status != "deleted",
            )
        )
        for child in result.scalars().all():
            if child.node_id not in seen:
                seen.add(child.node_id)
                collected.append(child)
                queue.append(child.node_id)

    return collected


async def get_ancestor_chain(
    session: AsyncSession, node_id: uuid.UUID
) -> list[Any] | None:
    """Return ordered ancestors from graph root to selected node."""
    selected = await get_node(session, node_id)
    if not selected or selected.status == "deleted":
        return None

    chain_from_selected: list[Any] = [selected]
    seen = {selected.node_id}
    current = selected

    while current.parent_id:
        if current.parent_id in seen:
            break

        parent = await get_node(session, current.parent_id)
        if not parent or parent.status == "deleted":
            break

        chain_from_selected.append(parent)
        seen.add(parent.node_id)
        current = parent

    return list(reversed(chain_from_selected))


async def get_subtree_nodes(
    session: AsyncSession, node_id: uuid.UUID
) -> list[Any] | None:
    """Return selected node plus all descendants (BFS, cycle-safe)."""
    root = await get_node(session, node_id)
    if not root or root.status == "deleted":
        return None

    collected: list[Any] = [root]
    seen = {root.node_id}
    queue = [root.node_id]

    while queue:
        parent_id = queue.pop(0)
        result = await session.execute(
            select(Node).where(
                Node.parent_id == parent_id,
                Node.status != "deleted",
            )
        )
        for child in result.scalars().all():
            if child.node_id in seen:
                continue
            seen.add(child.node_id)
            collected.append(child)
            queue.append(child.node_id)

    return collected


def _msg_to_dict(m: Any) -> dict[str, Any]:
    return {
        "message_id": str(m.message_id),
        "node_id": str(m.node_id),
        "role": m.role,
        "content": m.content,
        "timestamp": m.timestamp.isoformat() if m.timestamp else None,
        "token_count": m.token_count,
        "metadata": m.metadata_ or {},
    }


async def build_branch_graph_data(
    session: AsyncSession,
    project_id: uuid.UUID,
    root_node_id: uuid.UUID,
    project_name: str,
) -> dict[str, Any]:
    ancestor_chain = await get_ancestor_chain(session, root_node_id)
    if not ancestor_chain:
        return None

    subtree_nodes = await get_subtree_nodes(session, root_node_id)
    if not subtree_nodes:
        return None

    selected = ancestor_chain[-1]
    if selected.project_id != project_id:
        return None

    branch_nodes: list[Any] = []
    seen_node_ids: set[uuid.UUID] = set()
    for node in ancestor_chain + subtree_nodes:
        if node.node_id in seen_node_ids:
            continue
        seen_node_ids.add(node.node_id)
        branch_nodes.append(node)

    node_ids = {n.node_id for n in branch_nodes}

    exported_nodes: list[dict[str, Any]] = []
    for n in branch_nodes:
        parent_in_branch = n.parent_id in node_ids if n.parent_id else False
        merge_in_branch = n.merge_parent_id in node_ids if n.merge_parent_id else False

        export_parent = None
        if parent_in_branch:
            export_parent = str(n.parent_id)

        export_merge = str(n.merge_parent_id) if merge_in_branch else None

        exported_nodes.append(
            {
                "node_id": str(n.node_id),
                "title": n.title,
                "status": n.status,
                "node_type": n.node_type,
                "parent_id": export_parent,
                "merge_parent_id": export_merge,
                "inherited_context": n.inherited_context,
                "position": {"x": float(n.position_x), "y": float(n.position_y)},
            }
        )

    edges: list[dict[str, Any]] = []
    for n in branch_nodes:
        if n.node_id != root_node_id and n.parent_id and n.parent_id in node_ids:
            edges.append(
                {
                    "id": f"e-{n.parent_id}-{n.node_id}",
                    "source": str(n.parent_id),
                    "target": str(n.node_id),
                    "type": "context",
                }
            )
        if n.merge_parent_id and n.merge_parent_id in node_ids:
            edges.append(
                {
                    "id": f"e-merge-{n.merge_parent_id}-{n.node_id}",
                    "source": str(n.merge_parent_id),
                    "target": str(n.node_id),
                    "type": "merge",
                }
            )

    messages: dict[str, list[dict[str, Any]]] = {}
    for n in branch_nodes:
        msgs = await crud_get_messages(session, n.node_id)
        messages[str(n.node_id)] = [_msg_to_dict(m) for m in msgs]

    return {
        "nodes": exported_nodes,
        "edges": edges,
        "messages": messages,
        "meta": {
            "project_id": str(project_id),
            "project_name": project_name,
            "root_node_id": str(root_node_id),
        },
    }
