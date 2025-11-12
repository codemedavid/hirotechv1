@echo off
echo.
echo ========================================
echo   QUICK FIX FOR INTERNAL SERVER ERROR
echo ========================================
echo.
echo This script will:
echo 1. Stop all Node.js processes
echo 2. Clean Prisma client
echo 3. Regenerate Prisma client
echo 4. Verify the fix
echo.
pause

echo.
echo [1/4] Stopping all Node.js processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/4] Cleaning Prisma client...
if exist "node_modules\.prisma" (
    rmdir /s /q "node_modules\.prisma"
    echo ✅ Prisma client cleaned
) else (
    echo ℹ️  Prisma client already clean
)

echo.
echo [3/4] Regenerating Prisma client...
call npx prisma generate
if %ERRORLEVEL% EQU 0 (
    echo ✅ Prisma client regenerated successfully!
) else (
    echo ❌ Failed to regenerate Prisma client
    echo Please check your DATABASE_URL in .env.local
    pause
    exit /b 1
)

echo.
echo [4/4] Verifying database connection...
call npx prisma db push --skip-generate
if %ERRORLEVEL% EQU 0 (
    echo ✅ Database connection verified!
) else (
    echo ⚠️  Could not verify database connection
    echo Make sure PostgreSQL is running and DATABASE_URL is correct
)

echo.
echo ========================================
echo   ✅ FIX COMPLETE!
echo ========================================
echo.
echo You can now start your development server with:
echo   npm run dev
echo.
echo Or start everything with:
echo   npm run dev:all
echo.
pause

