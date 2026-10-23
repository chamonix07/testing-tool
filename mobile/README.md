# IN DONLOTiN — Android Mobile App (Flutter)

Aplikasi Android resmi untuk **IN DONLOTiN** (Universal Media Downloader) yang dibangun menggunakan **Flutter (Dart)** dengan Material Design 3, integrasi streaming download berkecepatan tinggi, pemutar media offline, dan dukungan server cloud maupun server lokal Wi-Fi.

---

## 📱 Fitur Utama Aplikasi

1. **Single Downloader:**
   - Tempel link langsung dari Clipboard dengan satu klik.
   - Pratinjau instan (<1 detik): Thumbnail, author, durasi, dan judul media.
   - Selector kualitas dinamis: Full HD 1080p, HD 720p, 480p, 360p, 2K, dan Audio MP3 320kbps.
   - Dukungan Carousel Instagram: Memilih slide foto/video tertentu untuk diunduh.
   - Progress bar interaktif dengan indikator ukuran terunduh (MB/total MB) dan persentase real-time.
2. **Batch Downloader:**
   - Masukkan banyak link sekaligus (satu baris per link).
   - Pengunduhan antrean otomatis secara sekuensial.
3. **Offline Media Vault (Tersimpan):**
   - Riwayat berkas yang tersimpan di memori HP (`/storage/emulated/0/Download/IN_DONLOTiN`).
   - Built-in Video Player (Chewie) & Image Viewer (Pinch-to-zoom) tanpa memerlukan aplikasi pihak ketiga.
   - Tombol Bagikan langsung ke WhatsApp, Telegram, Instagram, dll.
4. **Pengaturan Fleksibel:**
   - Server Base URL yang dapat diganti sewaktu-waktu (misal: domain Vercel Anda atau IP Wi-Fi lokal `http://192.168.x.x:8000`).
   - Tombol *Tes Koneksi* dengan indikator status online/offline.
   - Tema Gelap (Dark Mode) dan Terang (Light Mode).

---

## 🚀 Cara Menjalankan & Membangun APK

### Opsi 1: Otomatis via GitHub Actions (Tanpa Install Flutter di PC)
Proyek ini sudah dilengkapi dengan workflow GitHub Actions (`.github/workflows/build_apk.yml`):
1. Push commit ke repositori GitHub Anda.
2. Buka tab **Actions** di repositori GitHub Anda.
3. Pilih workflow **Build Android APK (Flutter)** lalu klik **Run workflow**.
4. Setelah build selesai (~3-5 menit), unduh berkas **IN_DONLOTiN_Release_APK** (berisi file `app-release.apk`) dan pasang langsung di HP Android Anda.

### Opsi 2: Menjalankan di Komputer Lokal (Jika Ada Flutter SDK)
1. Buka terminal dan masuk ke folder `mobile`:
   ```bash
   cd mobile
   ```
2. Ambil semua dependensi:
   ```bash
   flutter pub get
   ```
3. Hubungkan HP Android via kabel USB (aktifkan USB Debugging) atau buka Emulator, lalu jalankan:
   ```bash
   flutter run
   ```
4. Untuk mengompilasi berkas APK rilis:
   ```bash
   flutter build apk --release
   ```
   Berkas APK hasil build akan berada di `mobile/build/app/outputs/flutter-apk/app-release.apk`.
