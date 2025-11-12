@echo off
REM ============================================
REM Hiro CRM - Complete System Restart
REM Starts: Redis + Dev Server + Worker
REM ============================================

echo.
echo ========================================
echo  Hiro CRM - Full System Restart
echo ========================================
echo.

REM Step 1: Kill existing processes
echo [Step 1/5] Stopping all processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM redis-server.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ All processes stopped
) else (
    echo ℹ No processes were running
)
timeout /t 2 /nobreak >nul

REM Step 2: Clear Next.js cache
echo.
echo [Step 2/5] Clearing Next.js cache...
if exist .next (
    rmdir /s /q .next
    echo ✓ Cache cleared
) else (
    echo ℹ No cache to clear
)

REM Step 3: Start Redis
echo.
echo [Step 3/5] Starting Redis server...
start /B redis-server\redis-server.exe redis-server\redis.windows.conf
timeout /t 2 /nobreak >nul
tasklist | findstr /i "redis-server.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Redis started successfully
) else (
    echo ⚠ WARNING: Redis failed to start!
    pause
    exit /b 1
)

REM Step 4: Check environment
echo.
echo [Step 4/5] Checking environment...
if exist .env.local (
    echo ✓ Environment configured
) else (
    if exist .env (
        echo ✓ Environment configured
    ) else (
        echo ⚠ WARNING: No .env file found!
        pause
        exit /b 1
    )
)

REM Step 5: Start all services
echo.
echo [Step 5/5] Starting all services...
echo.
echo ========================================
echo  System Starting...
echo ========================================
echo.
echo ℹ Dev Server: http://localhost:3000
echo ℹ Redis: localhost:6379
echo ℹ Worker: Running in background
echo.
echo ℹ Press Ctrl+C to stop all services
echo.

npm run dev:all

