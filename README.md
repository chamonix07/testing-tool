# Universal Social Media & Media Downloader (Web UI)

Aplikasi web modern berbasis **Python (FastAPI + yt-dlp + Instaloader + FFmpeg)** untuk mengunduh konten dari berbagai platform media sosial:
- **Instagram**: Carousel (slide multi-foto & video), Reels, Single Photo, Caption.
- **YouTube**: Video Reguler (hingga 4K), YouTube Shorts, dan Konversi Audio (MP3 320kbps).
- **Twitter / X**: Video Tweet, GIF, dan Galeri Foto Multi-Slide.
- **Pinterest**: Video Pins dan Foto Resolusi Penuh (*lossless originals*).
- **Threads**: Postingan video dan foto.
- **TikTok**: Video tanpa watermark dan sound audio.

---

## ✨ Fitur Utama

1. **Auto-Detect Platform Cerdas**:
   - Cukup tempelkan link apa saja di satu kolom input. Sistem otomatis mengenali platform dan memilih *engine* ekstraksi yang tepat.

2. **Pilihan Kualitas & Konversi Format (Video vs MP3)**:
   - Pilih resolusi video: Kualitas Terbaik (MP4), 1080p Full HD, 720p HD.
   - Opsi konversi **Audio Saja (MP3 320kbps)** menggunakan FFmpeg lokal.

3. **Unduh Selektif (Slide demi Slide)**:
   - Untuk Carousel Instagram atau Galeri Twitter, Anda dapat memilih foto/video tertentu menggunakan kotak centang atau tombol "Pilih Semua".

4. **Batch Downloader Lintas Platform**:
   - Tempel banyak link sekaligus (bisa campuran YouTube, Instagram, Twitter, Pinterest).
   - Progres bar *real-time* dan tabel status unduhan per link.

5. **Pengelompokan Folder Otomatis**:
   - File otomatis disimpan rapi ke subfolder platform:
     - `downloads/Instagram/...`
     - `downloads/YouTube/...`
     - `downloads/Twitter/...`
     - `downloads/Pinterest/...`
   - Opsi penamaan folder: Berdasarkan Tanggal/Waktu, Nama Akun & Judul, atau Kombinasi Keduanya.

6. **Integrasi File Explorer Windows**:
   - Tombol cepat untuk langsung membuka folder unduhan di Windows Explorer.

---

## 🚀 Cara Menjalankan

### Cara 1: Sekali Klik (Paling Praktis)
Klik ganda file:
```
run.bat
```
Browser akan otomatis terbuka di `http://127.0.0.1:8000`.

### Cara 2: Terminal PowerShell
```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```
Lalu buka browser di [http://127.0.0.1:8000](http://127.0.0.1:8000).
