from fastapi import APIRouter
from backend.routers import nodes, projects

router = APIRouter(prefix="/api/v1")
router.include_router(nodes.router)
router.include_router(projects.router)
