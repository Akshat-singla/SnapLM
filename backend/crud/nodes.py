import uuid
from collections import defaultdict, deque

from fastapi import HTTPException
from models.db_models import Node
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


async def create_node(session: AsyncSession, node_data: dict) -> Node:
    node = Node(**node_data)
    session.add(node)
    return node


async def get_node(session: AsyncSession, node_id: uuid.UUID) -> Node | None:
    result = await session.execute(select(Node).where(Node.node_id == node_id))
    return result.scalar_one_or_none()


async def get_node_by_id_or_404(session: AsyncSession, node_id: uuid.UUID) -> Node:
    node = await get_node(session, node_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found")
    return node


async def update_node_status(session: AsyncSession, node_id: uuid.UUID, status: str):
    await session.execute(
        update(Node).where(Node.node_id == node_id).values(status=status)
    )


async def create_message(
    session: AsyncSession,
    node_id: uuid.UUID,
    role: str,
    content: str,
    token_count: int = None,
    metadata: dict = None,
) -> Message:
    msg = Message(
        node_id=node_id,
        role=role,
        content=content,
        token_count=token_count,
        metadata_=metadata or {},
    )
    session.add(msg)
    return msg


async def get_node_lineage(session: AsyncSession, node_id: uuid.UUID) -> list[Node]:
    """Returns [current, parent, grandparent, ..., root]"""
    lineage = []
    current_id = node_id
    while current_id:
        node = await get_node(session, current_id)
        if not node:
            break
        lineage.append(node)
        current_id = node.parent_id
    return lineage


async def get_node_ancestor_closure(
    session: AsyncSession, node_id: uuid.UUID
) -> list[Node]:
    """Returns selected node plus all unique upstream parents (including merge parents)."""
    selected = await get_node(session, node_id)
    if not selected:
        return []

    result = await session.execute(
        select(Node).where(
            Node.project_id == selected.project_id,
            Node.status != "deleted",
        )
    )
    project_nodes = result.scalars().all()

    node_by_id = {n.node_id: n for n in project_nodes}
    if node_id not in node_by_id:
        return []

    # Build child -> parents map from graph edges encoded on node rows.
    parent_map: dict[uuid.UUID, set[uuid.UUID]] = defaultdict(set)
    for node in project_nodes:
        if node.parent_id and node.parent_id in node_by_id:
            parent_map[node.node_id].add(node.parent_id)
        if node.merge_parent_id and node.merge_parent_id in node_by_id:
            parent_map[node.node_id].add(node.merge_parent_id)

    visited: set[uuid.UUID] = set()
    visit_order: list[uuid.UUID] = []
    queue = deque([node_id])

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


async def get_node_descendant_closure(
    session: AsyncSession, node_id: uuid.UUID
) -> list[Node]:
    """Returns selected node plus all unique downstream children (including merge children)."""
    selected = await get_node(session, node_id)
    if not selected:
        return []

    result = await session.execute(
        select(Node).where(
            Node.project_id == selected.project_id,
            Node.status != "deleted",
        )
    )
    project_nodes = result.scalars().all()

    node_by_id = {n.node_id: n for n in project_nodes}
    if node_id not in node_by_id:
        return []

    # Build parent -> children map from graph edges encoded on node rows.
    children_map: dict[uuid.UUID, set[uuid.UUID]] = defaultdict(set)
    for node in project_nodes:
        if node.parent_id and node.parent_id in node_by_id:
            children_map[node.parent_id].add(node.node_id)
        if node.merge_parent_id and node.merge_parent_id in node_by_id:
            children_map[node.merge_parent_id].add(node.node_id)

    visited: set[uuid.UUID] = set()
    visit_order: list[uuid.UUID] = []
    queue = deque([node_id])

    while queue:
        current_id = queue.popleft()
        if current_id in visited:
            continue

        visited.add(current_id)
        visit_order.append(current_id)

        for child_id in children_map.get(current_id, set()):
            if child_id not in visited:
                queue.append(child_id)

    return [node_by_id[nid] for nid in visit_order if nid in node_by_id]


async def get_all_descendants(session: AsyncSession, node_id: uuid.UUID) -> list[Node]:
    """
    Naive recursive implementation.
    For production with deep trees, CTEs are better, but keeping it simple for Phase 1.
    """
    descendants = []
    # Get direct children
    result = await session.execute(select(Node).where(Node.parent_id == node_id))
    children = result.scalars().all()
    for child in children:
        descendants.append(child)
        descendants.extend(await get_all_descendants(session, child.node_id))
    return descendants


async def get_tree(
    session: AsyncSession, project_id: uuid.UUID | None = None
) -> list[Node]:
    """Returns all non-deleted nodes, optionally filtered by project_id."""
    query = select(Node).where(Node.status != "deleted")
    if project_id is not None:
        query = query.where(Node.project_id == project_id)
    result = await session.execute(query)
    return result.scalars().all()


async def calculate_position(
    session: AsyncSession, parent_id: uuid.UUID | None
) -> tuple[float, float]:
    """Simple grid layout: parent.x, parent.y + 200. If multiple children, shift x."""
    if not parent_id:
        return 0.0, 0.0

    parent = await get_node(session, parent_id)
    if not parent:
        return 0.0, 0.0

    from sqlalchemy import func
    result = await session.execute(
        select(func.count()).select_from(Node).where(Node.parent_id == parent_id)
    )
    sibling_count = result.scalar_one()

    return parent.position_x + (sibling_count * 200), parent.position_y + 200.0
