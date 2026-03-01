from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import init_db, get_db
import backend.routers as routers
import logging
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    try:
        await init_db()
        logger.info("Database initialized successfully and connected.")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    
    yield
    # Shutdown logic (if any)
    logger.info("Shutting down SnapLM Backend.")

app = FastAPI(title="SnapLM Backend", version="0.1.0", lifespan=lifespan)

# middleware for frontend-backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(routers.router, tags=["API"])
@app.get("/", tags=["API"])
async def root():
    # TODO: Add metadata or docs to this route
    return {"message": "Info about SnapLM Backend"}

@app.get("/health", tags=["API"])
async def health(db: AsyncSession = Depends(get_db)):
    try:
        from sqlalchemy import text
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "error", "database": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=3500, reload=True)
