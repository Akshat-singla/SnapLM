from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from starlette import status

from database import init_db
from routers import user
from schemas import responses

app = FastAPI(
    title="SnapLM API",
    description="Advanced dynamic context LLM engine.",
    version="1.0.0",
)


# -------------------------
# Startup Event
# -------------------------
@app.on_event("startup")
async def on_startup():
    """
    Initialize database tables on startup.
    """
    await init_db()


# -------------------------
# Include Routers
# -------------------------
app.include_router(
    user.router,
    prefix="/api",
    tags=["Users"],
)


# -------------------------
# Health Check
# -------------------------
@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    return {"status": "ok"}


# -------------------------
# Global HTTP Exception Handler
# -------------------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=responses.ErrorResponse(
            error=exc.detail,
            error_code=str(exc.status_code),
        ).model_dump(),
    )


# -------------------------
# Catch-All Exception Handler
# -------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=responses.ErrorResponse(
            error="Internal server error",
            error_code="500",
        ).model_dump(),
    )