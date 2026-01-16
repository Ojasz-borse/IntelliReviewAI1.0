@echo off
echo ==========================================
echo      Starting Shetkari Mitra App...
echo ==========================================

echo 1. Starting Backend Server (Port 8000)...
start "Mandi Backend" cmd /k "cd mandi-mcp && python api.py"

echo 2. Starting Frontend (Port 3000/3001)...
start "Mandi Frontend" cmd /k "npm run dev"

echo ==========================================
echo App is launching!
echo Please wait for the browser to open.
echo If it doesn't open, go to: http://localhost:3000 (or 3001)
echo ==========================================
pause
