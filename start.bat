@echo off
title FormFlow Auto - Google Form Auto-Filler
echo =======================================================
echo    FORMFLOW AUTO - TU DONG DIEN GOOGLE FORMS
echo =======================================================
echo.
echo [1/2] Dang kiem tra Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js tren may tinh!
    echo Vui long cai dat Node.js tai: https://nodejs.org/
    pause
    exit /b
)

echo [2/2] Dang khoi chay may chu FormFlow Auto...
start "" http://localhost:3000
node server.js
pause
