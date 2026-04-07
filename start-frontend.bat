@echo off
cd /d "%~dp0"

echo Starting SnapLM Frontend...

cd frontend

if not exist "node_modules" (
    echo Installing npm dependencies...
    npm install
)

echo.
echo Starting Vite dev server on http://localhost:5173
echo Press Ctrl+C to stop.
echo.

npm run dev
