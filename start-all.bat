@echo off
cd /d "%~dp0"
echo =============================================
echo   SnapLM - Starting all services
echo =============================================
echo.

where docker >nul 2>&1
if errorlevel 1 (
    echo Docker not found — start Postgres another way or install Docker Desktop.
    goto :start_apps
)

echo [0/3] Starting Docker Postgres ^(postgres:16-alpine^)...
docker compose up -d
if errorlevel 1 (
    echo Docker command failed. Open Docker Desktop, wait until it is ready, then run start-docker-db.bat
) else (
    echo Waiting a few seconds for Postgres...
    timeout /t 5 /nobreak >nul
)

:start_apps
echo.
echo [1/3] Launching Backend in new window...
start "SnapLM Backend" cmd /k "%~dp0start-backend.bat"

timeout /t 3 /nobreak >nul

echo [2/3] Launching Frontend in new window...
start "SnapLM Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo [3/3] Reminders:
echo   - DB:  docker compose up -d   ^(or start-docker-db.bat^)
echo   - LLM: backend\ollama\setup-light-models.bat  ^(once, ~400MB^)
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo.
pause
