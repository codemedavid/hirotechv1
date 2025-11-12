@echo off
echo ========================================
echo Redis Upgrade Script for Windows
echo ========================================
echo.
echo This script will:
echo 1. Stop old Redis (3.0.504)
echo 2. Start Redis 7.x with Docker
echo 3. Verify the new version
echo.
echo Requirements: Docker Desktop must be installed and running
echo.
pause

echo.
echo [Step 1/4] Stopping old Redis...
taskkill /F /IM redis-server.exe 2>nul
if %errorlevel% equ 0 (
    echo ✓ Old Redis stopped
) else (
    echo → No old Redis process found ^(OK^)
)

echo.
echo [Step 2/4] Removing existing Redis container ^(if any^)...
docker rm -f redis-latest 2>nul
if %errorlevel% equ 0 (
    echo ✓ Removed old container
) else (
    echo → No existing container found ^(OK^)
)

echo.
echo [Step 3/4] Starting Redis 7 with Docker...
docker run -d --name redis-latest -p 6379:6379 redis:7-alpine
if %errorlevel% neq 0 (
    echo.
    echo ✗ Failed to start Redis container!
    echo.
    echo Please check:
    echo   1. Docker Desktop is installed
    echo   2. Docker Desktop is running
    echo   3. Port 6379 is not in use
    echo.
    pause
    exit /b 1
)
echo ✓ Redis container started

echo.
echo [Step 4/4] Verifying Redis version...
timeout /t 2 /nobreak >nul
docker exec redis-latest redis-cli INFO server | findstr redis_version
if %errorlevel% equ 0 (
    echo ✓ Redis is running
) else (
    echo ✗ Could not verify Redis version
)

echo.
echo ========================================
echo ✓ Redis Upgrade Complete!
echo ========================================
echo.
echo Redis 7.x is now running on localhost:6379
echo.
echo Next steps:
echo   1. Make sure .env.local has:
echo      REDIS_URL=redis://localhost:6379
echo.
echo   2. Start your application:
echo      npm run dev
echo.
echo   3. Start the worker:
echo      npm run worker
echo.
echo   4. Test campaigns - no more version errors!
echo.
echo ========================================
echo.
echo Docker commands:
echo   Start:  docker start redis-latest
echo   Stop:   docker stop redis-latest
echo   Logs:   docker logs redis-latest
echo   Remove: docker rm -f redis-latest
echo.
pause

