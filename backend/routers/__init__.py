import asyncio
from fastapi import APIRouter
from backend.routers.user import router as user_router
from backend.routers.projects import router as project_router
from backend.routers.nodes import router as nodes_router
from backend.routers.auth import router as auth_router

router = APIRouter()

router.include_router(user_router, tags=["user"])
router.include_router(project_router, tags=["project"])
router.include_router(nodes_router, tags=["nodes"])
router.include_router(auth_router, tags=["auth"])