@echo off
REM Deployment Script for Hiro Messenger Platform (Windows)
REM This script automates the deployment process to Vercel

echo ================================================
echo    HIRO DEPLOYMENT SCRIPT (Windows)
echo ================================================
echo.

REM Step 1: Verify we're in the right directory
echo Step 1: Verifying project directory...
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)
echo [OK] Project directory verified
echo.

REM Step 2: Check if Vercel CLI is installed
echo Step 2: Checking Vercel CLI...
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Vercel CLI not found. Installing...
    call npm install -g vercel
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Vercel CLI
        pause
        exit /b 1
    )
    echo [OK] Vercel CLI installed
) else (
    echo [OK] Vercel CLI already installed
)
echo.

REM Step 3: Run final build test
echo Step 3: Running final build test...
call npm run build > build-test.log 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Check build-test.log for details
    type build-test.log | more
    pause
    exit /b 1
)
echo [OK] Build successful
echo.

REM Step 4: Verify environment variables
echo Step 4: Checking environment variables...
if exist ".env.local" (
    echo [OK] .env.local found
) else (
    echo [WARN] .env.local not found
    echo        You'll need to add environment variables in Vercel dashboard
)
echo.

REM Step 5: Check if user is logged in to Vercel
echo Step 5: Checking Vercel login status...
call vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Not logged in to Vercel
    echo Please login to Vercel...
    call vercel login
    if %errorlevel% neq 0 (
        echo [ERROR] Vercel login failed
        pause
        exit /b 1
    )
)
for /f "delims=" %%i in ('vercel whoami 2^>nul') do set VERCEL_USER=%%i
echo [OK] Logged in as: %VERCEL_USER%
echo.

REM Step 6: Ask user for deployment type
echo Step 6: Choose deployment type
echo 1) Preview deployment (test before production)
echo 2) Production deployment
echo.
set /p choice="Enter choice (1 or 2): "

echo.
if "%choice%"=="1" (
    echo Deploying to preview...
    call vercel
) else if "%choice%"=="2" (
    echo Deploying to production...
    echo [WARN] WARNING: This will deploy to production!
    set /p confirm="Are you sure? (yes/no): "
    if "!confirm!"=="yes" (
        call vercel --prod
    ) else (
        echo Deployment cancelled
        pause
        exit /b 0
    )
) else (
    echo Invalid choice
    pause
    exit /b 1
)

echo.
echo ================================================
echo    DEPLOYMENT INITIATED!
echo ================================================
echo.
echo NEXT STEPS:
echo.
echo 1. After deployment, Vercel will provide a URL
echo 2. Go to Vercel dashboard: https://vercel.com/dashboard
echo 3. Add environment variables:
echo    - DATABASE_URL
echo    - REDIS_URL
echo    - NEXTAUTH_URL (set to your Vercel URL)
echo    - NEXTAUTH_SECRET
echo    - FACEBOOK_APP_ID
echo    - FACEBOOK_APP_SECRET
echo    - NEXT_PUBLIC_APP_URL (set to your Vercel URL)
echo.
echo 4. Update Facebook App settings:
echo    - OAuth Redirect URIs:
echo      * https://your-domain.vercel.app/api/facebook/callback
echo      * https://your-domain.vercel.app/api/facebook/callback-popup
echo    - Webhook URL:
echo      * https://your-domain.vercel.app/api/webhooks/facebook
echo.
echo 5. Redeploy after adding environment variables:
echo    vercel --prod
echo.
echo ================================================
pause

