@echo off
cd /d "%~dp0"
title Instagram Carousel & Reels Downloader
echo ====================================================
echo  Instagram Carousel & Reels Downloader Web Interface
echo ====================================================
echo.

if not exist "venv\Scripts\python.exe" (
    echo [INFO] Menyiapkan virtual environment...
    py -3.13 -m venv venv
    call "venv\Scripts\pip.exe" install -r requirements.txt
)

echo [INFO] Membuka antarmuka web di browser http://127.0.0.1:8000 ...
timeout /t 2 /nobreak >nul
start http://127.0.0.1:8000

echo [INFO] Menjalankan server aplikasi di http://127.0.0.1:8000 (Akses LAN: 0.0.0.0:8000)
echo [INFO] Tekan Ctrl+C untuk menghentikan server.
call "venv\Scripts\python.exe" -m uvicorn app:app --host 0.0.0.0 --port 8000
pause
