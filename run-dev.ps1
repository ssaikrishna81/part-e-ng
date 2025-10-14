# PowerShell script for easy development setup
param(
    [switch]$Compose,
    [switch]$Build,
    [switch]$Stop
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Vaccination Service Development" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($Stop) {
    Write-Host "Stopping all vaccination containers..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml down
    docker stop $(docker ps -q --filter ancestor=vaccination-dev:local) 2>$null
    Write-Host "Containers stopped." -ForegroundColor Green
    exit
}

if ($Compose) {
    Write-Host "Using Docker Compose with live reload..." -ForegroundColor Green
    Write-Host "Access at: http://localhost:5632" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    docker-compose -f docker-compose.dev.yml up --build
} else {
    Write-Host "Building vaccination development container..." -ForegroundColor Green
    docker build -f Dockerfile.dev -t vaccination-dev:local .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host "Starting vaccination service on port 5632..." -ForegroundColor Green
    Write-Host "Access at: http://localhost:5632" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    
    docker run --rm -p 5632:5632 -v "${PWD}:/app" -v /app/node_modules vaccination-dev:local
}

Write-Host ""
Write-Host "Service stopped." -ForegroundColor Yellow