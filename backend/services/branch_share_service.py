"""Serialized branch subgraph for sharing (one subtree, not the full canvas).

Traversal (BFS): start at ``root_node_id``, include that node, then repeatedly add
every child where ``parent_id`` points into the branch. This matches "main branch"
in the spec: the selected node plus all descendants along parent-child edges only.

Merge edges (``merge_parent_id``) are included in the export only when both endpoints
lie inside the collected set, so unrelated merge targets outside the subtree are
not pulled in.

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
    branch_nodes = await collect_branch_nodes(session, root_node_id)
    if not branch_nodes:
        return None
    root = branch_nodes[0]
    if root.project_id != project_id:
        return None

    node_ids = {n.node_id for n in branch_nodes}

    exported_nodes: list[dict[str, Any]] = []
    for n in branch_nodes:
        parent_in_branch = n.parent_id in node_ids if n.parent_id else False
        merge_in_branch = n.merge_parent_id in node_ids if n.merge_parent_id else False

        export_parent = None
        if n.node_id == root_node_id:
            export_parent = None
        elif parent_in_branch:
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
