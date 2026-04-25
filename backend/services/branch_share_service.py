"""Serialized contributing subgraph for sharing (selected node + all ancestors).

Traversal (BFS): start at ``root_node_id`` (selected node), then repeatedly walk
backward through every parent edge (``parent_id`` and ``merge_parent_id``).

This is a graph traversal, not a tree walk: merge nodes can produce multiple
upstream parent paths. The visited set defines the selected nodes, and only edges
with both endpoints in that set are exported.

Output shape stored in ``shared_projects.graph_data``::

    { "nodes": [...], "edges": [...], "messages": { node_id: [...] }, "meta": {...} }
"""

from __future__ import annotations

import uuid
from collections import defaultdict, deque
from typing import Any

from crud.messages import get_messages as crud_get_messages
from crud.nodes import get_node
from models.db_models import Node
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def collect_branch_nodes(
    session: AsyncSession, project_id: uuid.UUID, root_node_id: uuid.UUID
) -> list[Any] | None:
    """Selected node plus all upstream contributors via parent + merge edges."""
    selected = await get_node(session, root_node_id)
    if not selected or selected.status == "deleted":
        return None
    if selected.project_id != project_id:
        return None

    result = await session.execute(
        select(Node).where(
            Node.project_id == project_id,
            Node.status != "deleted",
        )
    )
    project_nodes = result.scalars().all()

    if not project_nodes:
        return None

    node_by_id = {n.node_id: n for n in project_nodes}
    if root_node_id not in node_by_id:
        return None

    # Build child -> parents adjacency so we can traverse backward.
    parent_map: dict[uuid.UUID, set[uuid.UUID]] = defaultdict(set)
    for n in project_nodes:
        if n.parent_id and n.parent_id in node_by_id:
            parent_map[n.node_id].add(n.parent_id)
        if n.merge_parent_id and n.merge_parent_id in node_by_id:
            parent_map[n.node_id].add(n.merge_parent_id)

    visited: set[uuid.UUID] = set()
    visit_order: list[uuid.UUID] = []
    queue = deque([root_node_id])

    while queue:
        current_id = queue.popleft()
        if current_id in visited:
            continue

        visited.add(current_id)
        visit_order.append(current_id)

        for parent_id in parent_map.get(current_id, set()):
            if parent_id not in visited:
                queue.append(parent_id)

    return [node_by_id[nid] for nid in visit_order if nid in node_by_id]


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
    branch_nodes = await collect_branch_nodes(session, project_id, root_node_id)
    if not branch_nodes:
        return None

    node_ids = {n.node_id for n in branch_nodes}

    exported_nodes: list[dict[str, Any]] = []
    for n in branch_nodes:
        parent_in_branch = n.parent_id in node_ids if n.parent_id else False
        merge_in_branch = n.merge_parent_id in node_ids if n.merge_parent_id else False

        export_parent = str(n.parent_id) if parent_in_branch else None

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
        if n.parent_id and n.parent_id in node_ids:
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
