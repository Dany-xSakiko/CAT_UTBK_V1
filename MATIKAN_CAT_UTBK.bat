@echo off
setlocal
title Menghentikan Sistem CAT UTBK V1
color 0C

echo ============================================================
echo          MENGHENTIKAN LAYANAN CAT UTBK V1
echo ============================================================
echo.

echo [1/2] Menghentikan server Backend (port 8000) dan Frontend (port 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    echo       Menghentikan proses PID %%a (Port 8000)...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo       Menghentikan proses PID %%a (Port 5173)...
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/2] Menutup jendela terminal server CAT UTBK...
taskkill /F /FI "WINDOWTITLE eq CAT UTBK - Backend API (8000)*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq CAT UTBK - Frontend Web (5173)*" >nul 2>&1

echo.
echo Semua layanan web CAT UTBK telah dihentikan.
timeout /t 2 >nul
exit
