$ErrorActionPreference = "Stop"

function Get-BackendUvicornCommand {
    param([string]$BackendDir)
    $venvPy = Join-Path $BackendDir ".venv\Scripts\python.exe"
    if (Test-Path $venvPy) {
        $proc = Start-Process -FilePath $venvPy -ArgumentList @("-c", "import sys") -Wait -PassThru -NoNewWindow
        if ($proc.ExitCode -eq 0) {
            return "Set-Location '$BackendDir'; & '$venvPy' -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
        }
        Write-Warning @"
backend\.venv exists but its Python interpreter failed (often after moving the repo or uninstalling Python).
Recreate the venv from the repo root:
  cd backend
  py -3 -m venv .venv
  .\.venv\Scripts\pip install -r requirements.txt
"@
    }
    if (Get-Command py -ErrorAction SilentlyContinue) {
        return "Set-Location '$BackendDir'; py -3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    }
    return "Set-Location '$BackendDir'; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "Installing frontend dependencies (npm install)..."
    Push-Location $frontendDir
    try {
        npm install
    } finally {
        Pop-Location
    }
}

$backendCmd = Get-BackendUvicornCommand -BackendDir $backendDir

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    $backendCmd
)

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontendDir'; npm run dev"
)

Write-Host "Started backend and frontend in separate windows."
Write-Host "Backend docs: http://127.0.0.1:8000/docs"
Write-Host "Frontend: Vite URL shown in frontend terminal (usually http://127.0.0.1:5173)"
Write-Host ""
Write-Host "If the backend logs a database connection error, start Postgres from the repo root:"
Write-Host "  docker compose up -d"
Write-Host "Then copy backend\.env.example to backend\.env if you do not have it yet."
