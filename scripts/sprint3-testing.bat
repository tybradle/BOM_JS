@echo off
REM Sprint 3 Testing & Validation Script
REM This script runs all tests for Sprint 3

echo ============================================
echo Sprint 3: Testing & Validation
echo ============================================
echo.

REM Task 3.1: Test Development Mode
echo [Task 3.1] Testing Development Mode...
echo Skipping dev mode test (requires manual verification)
echo.

REM Task 3.2: Test Standalone Server
echo [Task 3.2] Testing Standalone Server...
echo Building application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed!
    exit /b 1
)
echo.
echo Build successful! Testing standalone server...
echo Starting standalone server for 15 seconds...
start /B node .next\standalone\server.js
timeout /t 15 /nobreak
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *server.js*" 2>nul
echo.

REM Task 3.3: Test Production Electron
echo [Task 3.3] Testing Production Electron (electron-local)...
echo This requires manual verification - use: npm run electron-local
echo.

REM Task 3.4: Test Packaged Application  
echo [Task 3.4] Testing Packaged Application...
echo This requires manual verification after packaging
echo To package, run: npm run electron-pack
echo.

REM Task 3.5: End-to-End Workflow Test
echo [Task 3.5] End-to-End Workflow Test...
echo This requires manual verification in the application
echo.

echo ============================================
echo Sprint 3 Automated Tests Complete
echo ============================================
echo.
echo Next steps:
echo 1. Run: npm run electron-local (Task 3.3)
echo 2. Run: npm run electron-pack (Task 3.4)
echo 3. Verify E2E workflow in the app (Task 3.5)
echo.
