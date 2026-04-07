@echo off
cd /d "%~dp0"

echo Starting SnapLM Backend...

REM Add PostgreSQL to PATH if installed locally
if exist "C:\Program Files\PostgreSQL\16\bin" (
    set PATH=%PATH%;C:\Program Files\PostgreSQL\16\bin
)

cd backend

if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.windows.txt --quiet

if not exist ".env" (
    echo Creating default .env file...
    (
        echo DATABASE_URL=postgresql+asyncpg://pguser:mypassword@localhost:5432/snaplm
        echo OLLAMA_DEVICE_A_URL=http://localhost:11434
        echo OLLAMA_DEVICE_B_URL=http://localhost:11434
    ) > .env
    echo .env created.
)

echo.
echo Checking database connection...
python check_db.py
if errorlevel 1 (
    echo.
    echo Warning: Database check failed. The API may error until PostgreSQL is running.
)

echo.
echo Starting FastAPI server on http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Press Ctrl+C to stop.
echo.

uvicorn main:app --reload --host 0.0.0.0 --port 8000
