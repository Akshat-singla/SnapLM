"""Serialized contributing subgraph for sharing (selected node + all ancestors).

Start at ``root_node_id`` (selected node), then walk backward along every incoming
edge (built from ``parent_id`` / ``merge_parent_id`` on stored nodes — the DB
edge model). Merge nodes keep multiple upstream paths.

The ``visited`` set is the contributing node set. Exported edges are exactly
those with both endpoints in ``visited``, so paths stay continuous through merges.

Output shape stored in ``shared_projects.graph_data``::

    { "nodes": [...], "edges": [...], "messages": { node_id: [...] }, "meta": {...} }
"""

from __future__ import annotations

import uuid
from collections import defaultdict
from typing import Any

from crud.messages import get_messages as crud_get_messages
from crud.nodes import get_node
from models.db_models import Node
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


def _edges_from_project_nodes(project_nodes: list[Node]) -> list[dict[str, Any]]:
    """Directed edges from node link fields; types distinguish context vs merge."""
    node_ids = {n.node_id for n in project_nodes}
    edges: list[dict[str, Any]] = []

    for n in project_nodes:
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
    return edges


def _contributing_node_ids(
    root_node_id: uuid.UUID, edges: list[dict[str, Any]]
) -> set[uuid.UUID]:
    """Backward traversal: all nodes on any path that feeds into ``root_node_id``."""
    parent_map: dict[uuid.UUID, set[uuid.UUID]] = defaultdict(set)
    for edge in edges:
        target = edge.get("target")
        source = edge.get("source")
        if not target or not source:
            continue
        try:
            target_id = uuid.UUID(str(target))
            source_id = uuid.UUID(str(source))
        except (TypeError, ValueError):
            continue
        parent_map[target_id].add(source_id)

    visited: set[uuid.UUID] = set()
    stack: list[uuid.UUID] = [root_node_id]

    while stack:
        current_id = stack.pop()
        if current_id in visited:
            continue
        visited.add(current_id)
        for parent_id in parent_map.get(current_id, set()):
            stack.append(parent_id)

    return visited


def _filter_subgraph_edges(
    edges: list[dict[str, Any]], node_ids: set[uuid.UUID]
) -> tuple[
    list[dict[str, Any]],
    dict[uuid.UUID, set[uuid.UUID]],
    dict[uuid.UUID, set[uuid.UUID]],
]:
    """Keep edges inside the subgraph; split incoming sources by edge type."""
    kept: list[dict[str, Any]] = []
    context_sources: dict[uuid.UUID, set[uuid.UUID]] = defaultdict(set)
    merge_sources: dict[uuid.UUID, set[uuid.UUID]] = defaultdict(set)

    for edge in edges:
        try:
            source_id = uuid.UUID(str(edge["source"]))
            target_id = uuid.UUID(str(edge["target"]))
        except (KeyError, TypeError, ValueError):
            continue
        if source_id not in node_ids or target_id not in node_ids:
            continue
        kept.append(edge)
        if edge.get("type") == "merge":
            merge_sources[target_id].add(source_id)
        else:
            context_sources[target_id].add(source_id)

    return kept, context_sources, merge_sources


def _pick_export_parent(
    node: Node,
    contributing_ids: set[uuid.UUID],
    context_sources: set[uuid.UUID],
) -> str | None:
    """Align exported ``parent_id`` with a context edge in the subgraph."""
    if not context_sources:
        return None
    if node.parent_id and node.parent_id in contributing_ids:
        if node.parent_id in context_sources:
            return str(node.parent_id)
    if len(context_sources) == 1:
        return str(next(iter(context_sources)))
    return None


def _pick_export_merge_parent(
    node: Node,
    contributing_ids: set[uuid.UUID],
    merge_sources: set[uuid.UUID],
) -> str | None:
    """Align exported ``merge_parent_id`` with a merge edge in the subgraph."""
    if not merge_sources:
        return None
    if node.merge_parent_id and node.merge_parent_id in contributing_ids:
        if node.merge_parent_id in merge_sources:
            return str(node.merge_parent_id)
    if len(merge_sources) == 1:
        return str(next(iter(merge_sources)))
    return None


def _export_node(
    node: Node,
    contributing_ids: set[uuid.UUID],
    context_sources: dict[uuid.UUID, set[uuid.UUID]],
    merge_sources: dict[uuid.UUID, set[uuid.UUID]],
) -> dict[str, Any]:
    ctx = context_sources.get(node.node_id, set())
    mrg = merge_sources.get(node.node_id, set())

    return {
        "node_id": str(node.node_id),
        "title": node.title,
        "status": node.status,
        "node_type": node.node_type,
        "parent_id": _pick_export_parent(node, contributing_ids, ctx),
        "merge_parent_id": _pick_export_merge_parent(node, contributing_ids, mrg),
        "inherited_context": node.inherited_context,
        "position": {"x": float(node.position_x), "y": float(node.position_y)},
    }


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
) -> dict[str, Any] | None:
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

    all_edges = _edges_from_project_nodes(project_nodes)
    contributing_ids = _contributing_node_ids(root_node_id, all_edges)
    if not contributing_ids:
        return None

    edges, context_sources, merge_sources = _filter_subgraph_edges(
        all_edges, contributing_ids
    )

    contributing_nodes = [node_by_id[nid] for nid in contributing_ids if nid in node_by_id]
    exported_nodes = [
        _export_node(n, contributing_ids, context_sources, merge_sources)
        for n in contributing_nodes
    ]

    messages: dict[str, list[dict[str, Any]]] = {}
    for n in contributing_nodes:
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
