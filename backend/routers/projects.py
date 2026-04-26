import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models.db_models import Project, Node
from models.api_models import (
    CreateProjectRequest,
    UpdateProjectRequest,
    ProjectResponse,
    TreeNodeResponse,
)
from crud.nodes import get_tree
from crud.summaries import get_latest_summary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["Projects"])


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

async def _node_count(db: AsyncSession, project_id: uuid.UUID) -> int:
    r = await db.execute(
        select(func.count())
        .select_from(Node)
        .where(Node.project_id == project_id, Node.status != "deleted")
    )
    return r.scalar_one()


def _build_tree(flat: list, parent_id=None) -> list[TreeNodeResponse]:
    result = []
    for n in flat:
        if n.parent_id == parent_id:
            result.append(
                TreeNodeResponse(
                    node_id=n.node_id,
                    title=n.title,
                    status=n.status,
                    node_type=n.node_type,
                    message_count=getattr(n, "_msg_count", 0),
                    has_summary=getattr(n, "_has_summary", False),
                    merge_parent_id=n.merge_parent_id,
                    position={"x": n.position_x, "y": n.position_y},
                    children=_build_tree(flat, n.node_id),
                )
            )
    return result


def _project_response(p: Project, node_count: int) -> ProjectResponse:
    return ProjectResponse(
        project_id=p.project_id,
        name=p.name,
        description=p.description,
        is_archived=p.is_archived,
        created_at=p.created_at,
        updated_at=p.updated_at,
        node_count=node_count,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[ProjectResponse])
async def get_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project))
    projects = result.scalars().all()
    response = []
    for p in projects:
        response.append(_project_response(p, await _node_count(db, p.project_id)))
    return response


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(data: CreateProjectRequest, db: AsyncSession = Depends(get_db)):
    project = Project(name=data.name, description=data.description)
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return _project_response(project, 0)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.project_id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _project_response(project, await _node_count(db, project_id))


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    data: UpdateProjectRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.project_id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.is_archived is not None:
        project.is_archived = data.is_archived

    await db.commit()
    await db.refresh(project)
    return _project_response(project, await _node_count(db, project_id))


@router.delete("/{project_id}")
async def delete_project(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.project_id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()
    return {"status": "deleted", "project_id": str(project_id)}


@router.get("/{project_id}/nodes/tree", response_model=list[TreeNodeResponse])
async def get_project_tree(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    # Verify project exists
    r = await db.execute(select(Project).where(Project.project_id == project_id))
    if not r.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    nodes_list = await get_tree(db, project_id=project_id)

    # Attach message counts and summary flags directly on ORM objects
    from models.db_models import Message
    for node in nodes_list:
        msg_r = await db.execute(
            select(func.count()).select_from(Message).where(Message.node_id == node.node_id)
        )
        node._msg_count = msg_r.scalar_one()
        summary = await get_latest_summary(db, node.node_id)
        node._has_summary = summary is not None

    return _build_tree(nodes_list)
