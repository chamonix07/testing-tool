# IN DONLOTiN — Android App Reference & API Specification
> Universal Media Downloader Backend (Instagram, YouTube, Twitter/X, Pinterest, Threads, TikTok)

Dokumen ini dirancang sebagai berkas referensi utama (**Context Document / Project Knowledge Base**) untuk diunggah atau ditempelkan ke **Google AI Studio** saat mengembangkan aplikasi mobile Android (Flutter / Kotlin Jetpack Compose / React Native).

---

## 1. Ringkasan Proyek & Arsitektur

Backend aplikasi adalah **IN DONLOTiN** (FastAPI / Python) yang menyediakan API ekstraksi metadata, proxy media, pengunduhan berkas tunggal (MP4/MP3), dan pembuatan arsip ZIP.

- **Protokol:** HTTP/HTTPS REST API (JSON & Binary Stream)
- **Base URL Server:**
  - *Cloud / Production:* `https://<your-domain>.vercel.app` atau `https://<your-service>.railway.app`
  - *Lokal / Home Wi-Fi:* `http://192.168.x.x:8000` (dapat dideteksi via endpoint `/api/network-info`)
- **Fitur Utama Backend:**
  - Ekstraksi metadata instan (<1 detik via oEmbed & fast parsers).
  - Penanganan anti-bot & bypass pembatasan YouTube tanpa cookies wajib (menggunakan pipeline multi-client `visionos`, `android`, dan fallback stream progressive format 18).
  - Ekstraksi Carousel Instagram (multi-foto dan multi-video per slide).
  - Unduh langsung audio MP3 320kbps atau video HD/FHD (1080p, 720p, 480p, 360p, 2K).
  - Proxy media (`/api/proxy-media`) untuk memintas hotlinking/CORS CDN media Instagram, Twitter, dan YouTube.

---

## 2. Spesifikasi Endpoint API

### 2.1. Pratinjau Media (`/api/preview`)
Mengambil detail metadata, thumbnail, daftar slide (carousel), dan opsi kualitas video/audio.

- **Method:** `POST`
- **Endpoint:** `/api/preview`
- **Header:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "url": "https://www.instagram.com/reel/Cxxxxxx/"
}
```

- **Response Sukses (`200 OK`):**
```json
{
  "success": true,
  "platform": "instagram",
  "platform_name": "Instagram",
  "platform_icon": "instagram",
  "shortcode": "Cxxxxxx",
  "url": "https://www.instagram.com/reel/Cxxxxxx/",
  "author": "creator_username",
  "title": "Judul atau Deskripsi Konten",
  "caption": "Teks lengkap caption postingan...",
  "caption_summary": "Potongan teks caption untuk ringkasan...",
  "date_str": "2026-10-23 10:00:00",
  "date_iso": "2026-10-23T10:00:00.000000",
  "content_type": "reel",
  "is_video": true,
  "duration_str": "0:30",
  "thumbnail": "https://instagram.com/...",
  "total_items": 1,
  "available_formats": [
    {
      "id": "1080p",
      "label": "Full HD 1080p",
      "size": "Sangat Jernih",
      "badge": "1080p FHD"
    },
    {
      "id": "720p",
      "label": "HD 720p (Standar)",
      "size": "Rekomendasi",
      "badge": "720p HD"
    },
    {
      "id": "audio_mp3",
      "label": "Audio / Lagu Saja (MP3 320kbps)",
      "size": "Ringan",
      "badge": "Audio MP3"
    }
  ],
  "items": [
    {
      "index": 1,
      "is_video": true,
      "display_url": "https://instagram.com/preview.jpg",
      "video_url": "https://instagram.com/video.mp4",
      "download_url": "https://instagram.com/video.mp4"
    }
  ]
}
```

*Catatan untuk Carousel (Multi-slide):*
`content_type` bernilai `"carousel"`, `total_items > 1`, dan array `items` berisi daftar seluruh foto/video slide dengan nomor `index` (1, 2, 3, dst).

---

### 2.2. Unduh Media Tunggal Langsung ke HP (`/api/download-single`)
Endpoint terbaik untuk aplikasi Android karena langsung mengalirkan berkas biner `.mp4` atau `.mp3` ke perangkat (tanpa mewajibkan ZIP).

- **Method:** `GET`
- **Endpoint:** `/api/download-single`
- **Query Parameters:**
  - `url` *(string, required)*: Link konten media (contoh: `https://youtube.com/watch?v=...`)
  - `format_id` *(string, optional, default: `"1080p"`)*:
    - `"audio_mp3"`: Mengunduh audio MP3 320kbps.
    - `"1440p"`: 2K QHD Video
    - `"1080p"`: Full HD Video
    - `"720p"`: HD Video
    - `"480p"`: SD Video
    - `"360p"`: Hemat Kuota
- **Response Sukses (`200 OK`):**
  - Binary stream (`video/mp4` atau `audio/mpeg` atau `image/jpeg`).
  - Header `Content-Disposition: attachment; filename="<judul_konten>.<ext>"`.
- **Response Gagal (`400 Bad Request`):**
```json
{
  "detail": "Pesan error spesifik jika link tidak dapat diunduh"
}
```

---

### 2.3. Unduh Paket Arsip ZIP (`/api/download-zip`)
Digunakan saat pengguna memilih beberapa slide carousel atau ingin mengunduh semua media beserta berkas `caption.txt` dalam satu paket ZIP.

- **Method:** `POST`
- **Endpoint:** `/api/download-zip`
- **Header:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "url": "https://www.instagram.com/p/Cxxxxxx/",
  "selected_indices": [1, 2, 3],
  "format_id": "1080p",
  "naming_format": "content_name",
  "save_caption": true
}
```
- **Response Sukses (`200 OK`):**
  - Binary stream `application/zip`.
  - Header `Content-Disposition: attachment; filename="instagram_Cxxxxxx.zip"`.

---

### 2.4. Image / Video Proxy (`/api/proxy-media`)
Beberapa CDN (seperti Instagram fbcdn atau Twitter) memblokir pemuatan gambar/video secara langsung jika `Referer` atau `User-Agent` tidak sesuai. Gunakan endpoint ini di aplikasi Android saat memuat thumbnail atau memutar pratinjau.

- **Method:** `GET`
- **Endpoint:** `/api/proxy-media`
- **Query Parameter:** `url=<encoded_media_url>`
- **Contoh URL:** `https://your-api.vercel.app/api/proxy-media?url=https%3A%2F%2Finstagram.com%2F...`

---

### 2.5. Batch Preview & Batch Download
Untuk fitur multi-download (antrean link sekaligus):

- **Batch Preview:** `POST /api/batch-preview`
  - Body: `{ "urls": ["https://...", "https://..."] }`
  - Mengembalikan array ringkasan metadata untuk tiap URL.
- **Batch Download:** `POST /api/batch-download`
  - Body: `{ "urls": ["https://..."], "format_id": "1080p", "save_caption": true }`

---

### 2.6. Pengaturan & Konektivitas
- **Deteksi Jaringan Lokal (Wi-Fi):** `GET /api/network-info`
  - Mengembalikan daftar IP lokal komputer (misal: `192.168.1.15:8000`) agar aplikasi HP yang terhubung ke Wi-Fi yang sama dapat langsung terhubung ke server lokal.
- **Telemetri Sistem:** `GET /api/telemetry` (CPU, RAM, Uptime).
- **Pengaturan Server:** `GET /api/settings` & `POST /api/settings` (konfigurasi cookies, folder unduhan, format nama file).

---

## 3. Spesifikasi Arsitektur Aplikasi Android

### Rekomendasi Teknologi
- **Framework:** **Flutter (Dart)** (rekomendasi terbaik untuk integrasi UI modern cepat) ATAU **Kotlin (Jetpack Compose)** (Native Android).
- **HTTP Client:** `Dio` (Flutter) atau `Retrofit + OkHttp` (Kotlin).
- **Manajemen Download:**
  - Integrasi native `Android DownloadManager` atau background downloader agar pengunduhan tetap berjalan saat aplikasi diminimalkan.
  - Simpan berkas ke direktori publik: `Environment.DIRECTORY_DOWNLOADS` atau `Environment.DIRECTORY_MOVIES` (menggunakan Android MediaStore API untuk Android 10+ / Scoped Storage).
- **Komponen UI Utama:**
  1. **Tab 1 — Single Downloader:**
     - Kotak input URL dengan tombol otomatis *"Paste from Clipboard"*.
     - Kartu Pratinjau Media: Thumbnail, Judul, Author badge, Durasi, Chip Carousel selector.
     - Selector Kualitas: Chip 2K, 1080p, 720p, 480p, 360p, MP3.
     - Tombol Aksi: *"Unduh Video"*, *"Unduh MP3 Saja"*, *"Unduh ZIP"*.
     - Progress Bar interaktif saat mengunduh.
  2. **Tab 2 — Batch Downloader:**
     - Text area untuk menempelkan daftar banyak URL (1 per baris).
     - Antrean tabel unduh otomatis dengan status per baris.
  3. **Tab 3 — Media Vault (History & Pemutar):**
     - Daftar berkas yang sudah berhasil diunduh.
     - Integrasi built-in Video Player & Photo Gallery (bisa langsung putar offline).
     - Tombol *"Share to WhatsApp / Social Media"*.
  4. **Tab 4 — Settings:**
     - Konfigurasi Server API Base URL (bisa diarahkan ke server cloud Vercel/Railway atau server lokal Wi-Fi).
     - Switch tema Gelap/Terang (Dark/Light Mode).
