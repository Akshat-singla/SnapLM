$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"
$backendPython = Join-Path $backendDir ".venv\Scripts\python.exe"

if (-not (Test-Path $backendPython)) {
    throw "Backend virtual environment not found at $backendPython. Create it first: py -m venv backend\.venv"
}

# Start backend API in a separate PowerShell window.
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backendDir'; & '$backendPython' -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
)

# Start frontend dev server in a separate PowerShell window.
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontendDir'; npm run dev"
)

Write-Host "Started backend and frontend in separate windows."
Write-Host "Backend docs: http://127.0.0.1:8000/docs"
Write-Host "Frontend: Vite URL shown in frontend terminal (usually http://127.0.0.1:5173)"
