# PromesaPay Development Startup Script
# Starts both Flask backend and React frontend servers

Write-Host "==================================" -ForegroundColor Green
Write-Host "Starting PromesaPay Development" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

# Get the root directory
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"

# Check if directories exist
if (-not (Test-Path $backendDir)) {
    Write-Host "ERROR: Backend directory not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendDir)) {
    Write-Host "ERROR: Frontend directory not found!" -ForegroundColor Red
    exit 1
}

# Start Backend
Write-Host "Starting Flask Backend on http://localhost:5000..." -ForegroundColor Cyan
$backendProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; python run.py" -PassThru
$backendPID = $backendProcess.Id
Write-Host "Backend started (PID: $backendPID)" -ForegroundColor Green

# Wait a moment for backend to initialize
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting React Frontend on http://localhost:5173..." -ForegroundColor Cyan
$frontendProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev" -PassThru
$frontendPID = $frontendProcess.Id
Write-Host "Frontend started (PID: $frontendPID)" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "✓ Both servers are running!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop servers, close the terminal windows or press Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Wait for processes
$backendProcess.WaitForExit()
$frontendProcess.WaitForExit()
