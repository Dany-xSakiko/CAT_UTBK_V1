# CAT UTBK — Sistem Computer Assisted Test

Capstone Project · Frontend React + Backend Laravel (REST API + Sanctum).

```
CAT_V1/
├── backend/               Laravel 13 — REST API, MySQL, Sanctum token
├── frontend/              React 19 + Vite — SPA per-halaman (React Router)
├── frontend-prototype/    prototipe HTML/CSS/JS statis (acuan desain, tidak dipakai produksi)
├── app/ routes/ database/ potongan kode lama (arsip)
└── README.md
```

## Menjalankan

Prasyarat (sudah terpasang di mesin ini):
- PHP 8.3 `C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe`
- Composer `C:\laragon\bin\composer\composer.phar`
- MySQL 8.4 `C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe` (port 3306)
- Node + npm

### 1. MySQL
Laragon → Start All, atau manual:
```bash
C:/laragon/bin/mysql/mysql-8.4.3-winx64/bin/mysqld.exe --datadir="C:/laragon/data/mysql-8.4" --port=3306
```

### 2. Backend (port 8000)
```bash
cd backend
C:/laragon/bin/php/php-8.3.33-Win32-vs16-x64/php.exe artisan serve --host=127.0.0.1 --port=8000
```
Database `cat_utbk` sudah dimigrasi + disemai. Untuk reset:
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

## Proctoring

`frontend/src/hooks/useProctoring.js`:
- `getUserMedia` → frame tiap 3 detik (`canvas.toBlob`)
- deteksi wajah `face-api.js` tiny_face_detector dari `public/vendor` (offline)
- label: `No Face`, `Multiple Faces`, `Looking Away` (pindah tab), plus kirim bukti JPEG
- kirim ke `POST /api/proctoring/log` (multipart) → tersimpan di `backend/storage/app/public/proctoring`

Izin kamera ditolak → UI menampilkan status "Kamera mati" + tombol catat pelanggaran manual
(ujian tetap bisa dikerjakan).

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
