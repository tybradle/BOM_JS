@echo off
REM Quick restart script for Windows development
echo Cleaning up port 3002...
call npm run kill-port
timeout /t 1 /nobreak >nul
echo Starting development server...
call npm run dev
