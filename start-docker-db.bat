@echo off
cd /d "%~dp0"
echo =============================================
echo   SnapLM - Docker Postgres (lightweight)
echo =============================================
echo.
where docker >nul 2>&1
if errorlevel 1 (
    echo Docker not found. Install Docker Desktop and start it.
    pause
    exit /b 1
)
echo Starting postgres:16-alpine on port 5432...
docker compose up -d
if errorlevel 1 (
    echo.
    echo If this failed: open Docker Desktop and wait until it is running, then try again.
    pause
    exit /b 1
)
echo.
echo Waiting for database to accept connections...
timeout /t 6 /nobreak >nul
docker compose ps
echo.
echo Done. Database: localhost:5432  user: pguser  db: snaplm
echo.
pause
