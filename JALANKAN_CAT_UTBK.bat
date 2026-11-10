@echo off
setlocal
title Launcher CAT UTBK V1
color 0A

echo ============================================================
echo          MENJALANKAN SISTEM CAT UTBK V1 (FULLSTACK)
echo ============================================================
echo.

set "ROOT_DIR=%~dp0"
set "PHP_DIR=C:\laragon\bin\php\php-8.3.36-Win32-vs16-x64"
set "NODE_DIR=C:\laragon\bin\nodejs\node-v22"
set "MYSQL_DIR=C:\laragon\bin\mysql\mysql-8.4.3-winx64"
set "MYSQL_BIN=%MYSQL_DIR%\bin"

set "PATH=%PHP_DIR%;%NODE_DIR%;%MYSQL_BIN%;%PATH%"

REM 1. Cek dan jalankan MySQL (Port 3306)
echo [1/3] Memeriksa layanan database MySQL (port 3306)...
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo       MySQL belum berjalan. Menjalankan MySQL 8.4 di background...
    if exist "%MYSQL_BIN%\mysqld.exe" (
        powershell -NoProfile -Command "Start-Process -FilePath '%MYSQL_BIN%\mysqld.exe' -ArgumentList '--defaults-file=\"%MYSQL_DIR%\my.ini\"' -WindowStyle Hidden"
        timeout /t 4 /nobreak >nul
        echo       MySQL berhasil dijalankan.
    ) else (
        echo [PERINGATAN] mysqld.exe tidak ditemukan di %MYSQL_BIN%
        echo              Pastikan MySQL Laragon sudah menyala!
    )
) else (
    echo       MySQL sudah berjalan di port 3306.
)

REM 2. Cek dan jalankan Backend Laravel API (Port 8000)
echo [2/3] Memeriksa Backend Laravel API (port 8000)...
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo       Menjalankan server Backend Laravel di http://127.0.0.1:8000 ...
    start "CAT UTBK - Backend API (8000)" /D "%ROOT_DIR%backend" cmd /k "set PATH=%PHP_DIR%;%MYSQL_BIN%;%%PATH%% && php artisan serve --host=127.0.0.1 --port=8000"
    timeout /t 2 /nobreak >nul
) else (
    echo       Backend Laravel sudah berjalan di port 8000.
)

REM 3. Cek dan jalankan Frontend React Vite (Port 5173)
echo [3/3] Memeriksa Frontend React + Vite (port 5173)...
netstat -ano | findstr ":5173 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo       Menjalankan server Frontend Vite di http://localhost:5173 ...
    start "CAT UTBK - Frontend Web (5173)" /D "%ROOT_DIR%frontend" cmd /k "set PATH=%NODE_DIR%;%%PATH%% && npm.cmd run dev -- --host 127.0.0.1 --port 5173"
    timeout /t 3 /nobreak >nul
) else (
    echo       Frontend Vite sudah berjalan di port 5173.
)

echo.
echo ============================================================
echo   SEMUA LAYANAN BERHASIL DIJALANKAN!
echo   - Frontend Web : http://localhost:5173
echo   - Backend API  : http://127.0.0.1:8000
echo   - Database     : MySQL (port 3306 - cat_system)
echo ============================================================
echo.
echo Membuka aplikasi di browser...
start "" "http://localhost:5173"
timeout /t 3 >nul
exit
