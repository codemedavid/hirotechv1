@echo off
echo.
echo ========================================
echo   STOPPING ALL NODE PROCESSES
echo ========================================
echo.
echo This will kill all running Node.js processes...
echo.
pause

taskkill /F /IM node.exe /T 2>nul

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ All Node.js processes stopped successfully!
) else (
    echo.
    echo ℹ️  No Node.js processes were running.
)

echo.
echo Done! You can now start your development server.
echo.
pause

