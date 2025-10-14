@echo off
REM Easy development setup for vaccination service

echo ========================================
echo   Vaccination Service Development
echo ========================================
echo.

if "%1"=="compose" (
    echo Using Docker Compose...
    echo Starting vaccination service with live reload...
    docker-compose -f docker-compose.dev.yml up --build
) else (
    echo Using direct Docker run...
    echo Building vaccination development container...
    docker build -f Dockerfile.dev -t vaccination-dev:local .
    
    if %ERRORLEVEL% NEQ 0 (
        echo Build failed!
        pause
        exit /b 1
    )
    
    echo Starting vaccination service on port 5632...
    echo Access at: http://localhost:5632
    echo Press Ctrl+C to stop
    echo.
    docker run --rm -p 5632:5632 -v "%CD%:/app" -v /app/node_modules vaccination-dev:local
)

echo.
echo Service stopped.
pause