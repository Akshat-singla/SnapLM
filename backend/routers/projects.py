from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.models.api_models import (
    TreeNodeResponse,UpdateProjectRequest
)
from backend.crud.nodes import (create_node as crud_create_node,
                                get_tree as crud_get_tree)
from backend.crud.summaries import get_latest_summary
from backend.services.event_processor import record_event

from backend.models.api_models import CreateProjectRequest, ProjectResponse
from backend.models.db_models import Project
from sqlalchemy import select, func as sql_func

import logging
import uuid


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/api/v1/projects", response_model=ProjectResponse)
async def create_project(request: CreateProjectRequest, session: AsyncSession = Depends(get_db)):
    project = Project(
        name=request.name,
        description=request.description,
        owner_id=request.owner_id,
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)

    root_node_data = {
        "title": f"{project.name} Root",
        "project_id": project.project_id,
        "parent_id": None,
        "node_type": "root",
        "position_x": 0.0,
        "position_y": 0.0,
        "status": "active"
    }
    root_node = await crud_create_node(session, root_node_data)
    await record_event(session, root_node.node_id, "NODE_CREATED", {
        "title": root_node.title,
        "parent_id": None,
        "project_id": str(project.project_id),
        "is_root": True
    })

    logger.info(f"Created project: {project.project_id} - {project.name} with root node: {root_node.node_id}")

    return ProjectResponse(
        project_id=project.project_id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
        node_count=1
    )

@router.get("/api/v1/projects", response_model=list[ProjectResponse])
async def list_projects(session: AsyncSession = Depends(get_db)):
    from backend.models.db_models import Node

    # node count
    result = await session.execute(
        select(
            Project,
            sql_func.count(Node.node_id).label("node_count")
        )
        .outerjoin(Node, Project.project_id == Node.project_id)
        .group_by(Project.project_id)
        .order_by(Project.created_at.desc())
    )

    projects = []
    for row in result:
        project = row[0]
        node_count = row[1]
        projects.append(ProjectResponse(
            project_id=project.project_id,
            name=project.name,
            description=project.description,
            owner_id=project.owner_id,
            created_at=project.created_at,
            updated_at=project.updated_at,
            node_count=node_count
        ))

    return projects

@router.get("/api/v1/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: uuid.UUID, session: AsyncSession = Depends(get_db)):
    from backend.models.db_models import Node

    result = await session.execute(
        select(Project).where(Project.project_id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    count_result = await session.execute(
        select(sql_func.count(Node.node_id)).where(Node.project_id == project_id)
    )
    node_count = count_result.scalar() or 0

    return ProjectResponse(
        project_id=project.project_id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
        node_count=node_count
    )

@router.put("/api/v1/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: uuid.UUID, request: UpdateProjectRequest, session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Project).where(Project.project_id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if request.name is not None:
        project.name = request.name
    if request.description is not None:
        project.description = request.description
    if request.owner_id is not None:
        project.owner_id = request.owner_id

    await session.commit()
    await session.refresh(project)

    return ProjectResponse(
        project_id=project.project_id,
        name=project.name,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
        node_count=len(project.nodes) if project.nodes else 0
    )

@router.delete("/api/v1/projects/{project_id}")
async def delete_project(project_id: uuid.UUID, session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Project).where(Project.project_id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await session.delete(project)
    await session.commit()

    logger.info(f"Deleted project: {project_id}")

    return {"status": "deleted", "project_id": str(project_id)}

@router.get("/api/v1/projects/{project_id}/nodes/tree", response_model=list[TreeNodeResponse])
async def get_project_tree(project_id: uuid.UUID, session: AsyncSession = Depends(get_db)):
    # Verify project exists
    result = await session.execute(
        select(Project).where(Project.project_id == project_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    nodes = await crud_get_tree(session, project_id=project_id)

    node_summaries = {}
    for n in nodes:
        summary = await get_latest_summary(session, n.node_id)
        if summary:
            summary_json = summary.summary
            if isinstance(summary_json, dict):
                facts = summary_json.get("FACTS", [])
                if isinstance(facts, list) and facts:
                    node_summaries[n.node_id] = "; ".join(str(f) for f in facts[:3])
                else:
                    node_summaries[n.node_id] = str(summary_json.get("summary", ""))[:200]

    # Build tree in memory
    node_map = {}
    roots = []

    for n in nodes:
        summary_text = node_summaries.get(n.node_id)
        node_map[n.node_id] = TreeNodeResponse(
            node_id=n.node_id,
            title=n.title,
            status=n.status,
            node_type=n.node_type,
            has_summary=n.node_id in node_summaries,
            summary_text=summary_text,
            merge_parent_id=n.merge_parent_id,
            position={"x": n.position_x, "y": n.position_y},
            children=[]
        )

    for n in nodes:
        if n.parent_id and n.parent_id in node_map:
            node_map[n.parent_id].children.routerend(node_map[n.node_id])
        else:
            roots.routerend(node_map[n.node_id])

    return roots
