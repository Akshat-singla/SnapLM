@echo off
echo =============================================
echo   SnapLM - PostgreSQL Setup
echo =============================================
echo.

REM Check if postgres is already installed
where psql >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo PostgreSQL already installed, skipping download.
    goto :setup_db
)

REM Check common install path
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    echo PostgreSQL 16 found at default path.
    goto :setup_db
)

echo Downloading PostgreSQL 16 installer...
echo This is ~350MB, please wait...
echo.

powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://get.enterprisedb.com/postgresql/postgresql-16.13-2-windows-x64.exe' -OutFile '%TEMP%\pg16-installer.exe' -UseBasicParsing }"

if not exist "%TEMP%\pg16-installer.exe" (
    echo Download failed. Please install PostgreSQL manually from:
    echo https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo.
echo Running PostgreSQL installer silently...
echo Installation directory: C:\Program Files\PostgreSQL\16
echo.

"%TEMP%\pg16-installer.exe" ^
    --mode unattended ^
    --unattendedmodeui none ^
    --superpassword "postgres" ^
    --servicename "postgresql-x64-16" ^
    --servicepassword "postgres" ^
    --serverport 5432 ^
    --prefix "C:\Program Files\PostgreSQL\16" ^
    --datadir "C:\Program Files\PostgreSQL\16\data"

echo.
echo PostgreSQL installed. Waiting for service to start...
timeout /t 5 /nobreak >nul

:setup_db
echo.
echo Setting up SnapLM database and user...

set PGBIN=C:\Program Files\PostgreSQL\16\bin
set PGPASSWORD=postgres

REM Create user and database
"%PGBIN%\psql.exe" -U postgres -h localhost -p 5432 -c "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pguser') THEN CREATE USER pguser WITH PASSWORD 'mypassword'; END IF; END $$;" 2>&1
"%PGBIN%\psql.exe" -U postgres -h localhost -p 5432 -c "SELECT 'CREATE DATABASE snaplm OWNER pguser' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'snaplm')\gexec" 2>&1
"%PGBIN%\psql.exe" -U postgres -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE snaplm TO pguser;" 2>&1

echo.
echo =============================================
echo   Database setup complete!
echo   Host:     localhost:5432
echo   Database: snaplm
echo   User:     pguser
echo   Password: mypassword
echo =============================================
echo.
echo You can now run start-all.bat
echo.
pause
