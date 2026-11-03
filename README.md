# CAT UTBK — Sistem Computer Assisted Test

Capstone Project · Frontend React + Backend Laravel (REST API + Sanctum).

```
CAT_V1/
├── backend/               Laravel 13 — REST API, MySQL, Sanctum token
├── frontend/              React 19 + Vite — SPA per-halaman (React Router)
├── frontend-prototype/    prototipe HTML/CSS/JS statis (acuan desain, tidak dipakai produksi)
├── app/ routes/ database/ potongan kode lama (arsip)
├── README.md
└── README_INTEGRASI_AI.md Dokumentasi integrasi modul AI BlazeFace
```

## Menjalankan

Prasyarat (sudah terpasang di mesin ini):
- PHP 8.3 `C:\laragon\bin\php\php.exe`
- Composer `C:\laragon\bin\composer\composer.phar`
- MySQL 8.4 `C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe` (port 3306)
- Node (v22) + npm `C:\laragon\bin\nodejs\node-v22\`

### 1. MySQL
Laragon → Start All, atau manual:
```bash
C:/laragon/bin/mysql/mysql-8.4.3-winx64/bin/mysqld.exe --datadir="C:/laragon/data/mysql-8.4" --port=3306
```

### 2. Backend (port 8000)
```bash
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```
Database `cat_system` sudah dimigrasi + disemai. Untuk reset:
```bash
php artisan migrate:fresh --seed --force
```

### 3. Frontend (port 5173)
```bash
cd frontend
npm install     # sekali saja
npm run dev
```
Buka http://localhost:5173 — Vite mem-proxy `/api` dan `/storage` ke `127.0.0.1:8000`,
jadi tidak ada masalah CORS.

## Akun demo

| Peran | Username | Password |
|---|---|---|
| Admin | `admin` | `demo123` |
| Peserta | `peserta_001` … `peserta_004` | `demo123` |

## Halaman

Admin (`/admin`):
- `/admin` — dashboard: statistik, distribusi pelanggaran, ujian terbaru
- `/admin/ujian` — CRUD ujian + toggle status aktif
- `/admin/soal` — bank soal per ujian (CRUD, kunci jawaban)
- `/admin/pengguna` — CRUD akun admin/peserta
- `/admin/laporan` — laporan proctoring + modal bukti kamera + export CSV

Peserta (`/peserta`):
- `/peserta` — daftar ujian tersedia, riwayat skor
- `/peserta/ujian/:idRekam` — pengerjaan: timer, autosave, navigasi soal, tandai, kamera
- `/peserta/hasil/:idRekam` — skor akhir, rincian, timeline pelanggaran

## Proctoring Berbasis AI (BlazeFace + TensorFlow.js)

Modul AI Computer Vision terintegrasi di `frontend/src/ai/` dan `frontend/src/hooks/useProctoring.js`:
- Kamera `getUserMedia` memproses frame secara lokal di browser peserta (*client-side inference*) tiap 3 detik.
- Model CNN **BlazeFace** via TensorFlow.js dengan prapemrosesan kontras (1.1) & kecerahan (1.05) kanvas.
- Pascapemrosesan *Non-Maximum Suppression* (NMS IoU 0.35) dan ambang batas ukuran wajah minimum (45px).
- Gerbang toleransi anomali (*Anomaly Gate*): butuh 2 kali sampling berturut-turut sebelum memicu peringatan ke peserta, serta cooldown 25 detik per jenis status.
- Status deteksi: `Normal`, `No Face`, `Multiple Faces`, dan `Looking Away` (saat berpindah tab browser).
- Pengiriman bukti: Frame JPEG otomatis dikompresi dan dikirim ke `POST /api/proctoring/log` (multipart) → tersimpan di `backend/storage/app/public/proctoring`.
- Detail lengkap integrasi teknis dicatat di [README_INTEGRASI_AI.md](README_INTEGRASI_AI.md).

Izin kamera ditolak → UI menampilkan status "Kamera tidak aktif" dan ujian tetap dapat dikerjakan.

## API

Semua endpoint ada di `backend/routes/api.php`; auth pakai Bearer token Sanctum.
Frontend memanggilnya lewat `frontend/src/lib/api.js` (axios, base `/api`).

`POST /api/login` → `{ success, user, token }`, lalu header `Authorization: Bearer <token>`.

## Build produksi

```bash
cd frontend && npm run build     # hasil di frontend/dist
cd backend && php artisan config:cache && php artisan route:cache
```
Untuk deploy terpisah, set `VITE_API_BASE=https://domain-api/api` saat build frontend.
