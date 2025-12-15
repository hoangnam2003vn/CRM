@echo off
chcp 65001 >nul
title CRM Project Launcher

echo ╔══════════════════════════════════════════════════════════╗
echo ║           🚀 CRM PROJECT LAUNCHER 🚀                    ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║  Backend:  http://localhost:5000                        ║
echo ║  Frontend: http://localhost:4000                        ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: Kiểm tra Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js chưa được cài đặt!
    echo Vui lòng cài đặt Node.js từ https://nodejs.org
    pause
    exit /b 1
)

echo [INFO] Đang khởi động Backend server...
echo.

:: Khởi động Backend trong cửa sổ mới
start "CRM Backend - Port 5000" cmd /k "cd /d %~dp0backend && echo [BACKEND] Đang cài đặt dependencies... && npm install && echo. && echo [BACKEND] Khởi động server... && node server.js"

:: Chờ backend khởi động
echo [INFO] Chờ Backend khởi động (5 giây)...
timeout /t 5 /nobreak >nul

echo [INFO] Đang khởi động Frontend server...
echo.

:: Khởi động Frontend trong cửa sổ mới
start "CRM Frontend - Port 4000" cmd /k "cd /d %~dp0trang_chu_crm && echo [FRONTEND] Đang cài đặt dependencies... && npm install && echo. && echo [FRONTEND] Khởi động React app... && npm start"

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  ✅ Đã khởi động cả Backend và Frontend!                ║
echo ║                                                          ║
echo ║  📌 Backend API:  http://localhost:5000/api             ║
echo ║  📌 Frontend App: http://localhost:4000                 ║
echo ║                                                          ║
echo ║  💡 Đóng cửa sổ này sẽ KHÔNG dừng servers               ║
echo ║  💡 Để dừng: đóng 2 cửa sổ CMD Backend/Frontend         ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: Tự động mở trình duyệt sau 10 giây
echo [INFO] Mở trình duyệt sau 10 giây...
timeout /t 10 /nobreak >nul
start http://localhost:4000

echo.
echo Nhấn phím bất kỳ để đóng cửa sổ này...
pause >nul
