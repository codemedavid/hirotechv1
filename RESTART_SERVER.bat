@echo off
REM ============================================
REM Hiro CRM - Complete Server Restart Script
REM ============================================

echo.
echo ========================================
echo  Hiro CRM - Server Restart
echo ========================================
echo.

REM Step 1: Kill existing Node.js processes
echo [Step 1/5] Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Node.js processes stopped
) else (
    echo ℹ No Node.js processes were running
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

REM Step 3: Check Redis
echo.
echo [Step 3/5] Checking Redis server...
tasklist | findstr /i "redis-server.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Redis is running
) else (
    echo ⚠ Redis is not running!
    echo   Starting Redis server...
    start /B redis-server\redis-server.exe redis-server\redis.windows.conf
    timeout /t 2 /nobreak >nul
    echo ✓ Redis started
)

REM Step 4: Check environment variables
echo.
echo [Step 4/5] Checking environment variables...
if exist .env.local (
    echo ✓ .env.local found
) else (
    if exist .env (
        echo ✓ .env found
    ) else (
        echo ⚠ WARNING: No .env file found!
        echo   Please create .env.local with required variables
        pause
        exit /b 1
    )
)

REM Step 5: Start development server
echo.
echo [Step 5/5] Starting development server...
echo.
echo ========================================
echo  Server Starting...
echo ========================================
echo.
echo ℹ Server will be available at: http://localhost:3000
echo ℹ Press Ctrl+C to stop the server
echo.

npm run dev

