@echo off
REM PromesaPay Development Startup Script (Batch)
REM Starts both Flask backend and React frontend servers

cls
color 0A
echo ==================================
echo Starting PromesaPay Development
echo ==================================
echo.

REM Get the script directory
setlocal enabledelayedexpansion
set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%backend
set FRONTEND_DIR=%SCRIPT_DIR%frontend

REM Check if directories exist
if not exist "%BACKEND_DIR%" (
    echo ERROR: Backend directory not found at %BACKEND_DIR%
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    echo ERROR: Frontend directory not found at %FRONTEND_DIR%
    pause
    exit /b 1
)

REM Start Backend
echo Starting Flask Backend on http://localhost:5000...
start "PromesaPay Backend" cmd /k "cd /d %BACKEND_DIR% && python run.py"
echo Backend started
timeout /t 3 /nobreak

REM Start Frontend
echo Starting React Frontend on http://localhost:5173...
start "PromesaPay Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"
echo Frontend started

echo.
echo ==================================
echo Both servers are running!
echo ==================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
echo To stop servers, close the terminal windows
echo.
pause
