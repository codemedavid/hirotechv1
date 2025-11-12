@echo off
title Hiro Campaign System

echo.
echo ========================================
echo   STARTING HIRO CAMPAIGN SYSTEM
echo ========================================
echo.

REM Check if REDIS_URL is set
if "%REDIS_URL%"=="" (
    echo Checking environment...
    if exist .env.local (
        echo [OK] .env.local file found
    ) else (
        echo [WARNING] .env.local not found
        echo Please create .env.local with REDIS_URL
        pause
        exit /b 1
    )
)

echo Starting services...
echo.

REM Start worker in a new window
echo [1/2] Starting Campaign Worker...
start "Campaign Worker" cmd /k "npm run worker"

REM Wait a moment for worker to start
timeout /t 3 /nobreak >nul

REM Start dev server in a new window
echo [2/2] Starting Dev Server...
start "Dev Server" cmd /k "npm run dev"

REM Wait a moment for dev server to start
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   SYSTEM STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Two new windows opened:
echo   1. Campaign Worker (processes messages)
echo   2. Dev Server (web application)
echo.
echo Opening browser...
start http://localhost:3000
echo.
echo Your app is now running at:
echo   http://localhost:3000
echo.
echo To send campaign messages:
echo   1. Go to Campaigns page
echo   2. Create or select a campaign
echo   3. Click "Start Campaign"
echo   4. Watch the Worker window for progress
echo.
echo To stop:
echo   Close both terminal windows
echo   or press Ctrl+C in each window
echo.
pause

