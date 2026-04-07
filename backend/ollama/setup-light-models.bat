@echo off
cd /d "%~dp0"
echo =============================================
echo   SnapLM - Light Ollama models (~400MB base)
echo   Base: qwen2.5:0.5b  (reused for both agents)
echo =============================================
echo.

where ollama >nul 2>&1
if errorlevel 1 (
    echo Ollama not in PATH. Install from https://ollama.com and ensure "ollama serve" is running.
    pause
    exit /b 1
)

echo [1/3] Pulling qwen2.5:0.5b (one download for chat + graph)...
ollama pull qwen2.5:0.5b
if errorlevel 1 (
    echo Pull failed. Check internet and that Ollama is running.
    pause
    exit /b 1
)

echo.
echo [2/3] Creating main-reasoner...
ollama create main-reasoner -f Modelfile.main-reasoner
if errorlevel 1 pause & exit /b 1

echo.
echo [3/3] Creating graph-builder...
ollama create graph-builder -f Modelfile.graph-builder
if errorlevel 1 pause & exit /b 1

echo.
echo Done. Run: ollama list
ollama list
echo.
pause
