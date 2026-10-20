$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $scriptDir

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " Instagram Carousel & Reels Downloader Web Interface" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

$pythonExe = Join-Path $scriptDir "venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Host "[INFO] Menyiapkan virtual environment..." -ForegroundColor Yellow
    py -3.13 -m venv venv
    & (Join-Path $scriptDir "venv\Scripts\pip.exe") install -r requirements.txt
}

Write-Host "[INFO] Membuka antarmuka web di http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process "http://127.0.0.1:8000"

Write-Host "[INFO] Server aktif! Tekan Ctrl+C untuk berhenti.`n" -ForegroundColor Green
& $pythonExe -m uvicorn app:app --host 127.0.0.1 --port 8000
