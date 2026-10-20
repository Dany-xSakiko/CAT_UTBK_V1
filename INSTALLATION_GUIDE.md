# Panduan Instalasi & Setup

Dokumen ini berisi langkah-langkah detail untuk menginstall dan menjalankan Sistem CAT.

---

## Prerequisites

Pastikan sudah terinstall:
- PHP >= 8.1
- MySQL >= 5.7 atau MariaDB >= 10.3
- Composer
- Laravel 10.x
- Node.js & NPM (untuk frontend)

---

## Langkah Instalasi

### 1. Setup Database

Buka MySQL/phpMyAdmin atau akses via terminal:

```bash
mysql -u root -p
```

Buat database baru:

```sql
CREATE DATABASE cat_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Keluar dari MySQL:
```sql
exit;
```

### 2. Konfigurasi Environment

Copy file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Edit file `.env` dan sesuaikan konfigurasi database:

```env
APP_NAME="Sistem CAT"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cat_system
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Install Dependencies

```bash
composer install
```

### 4. Generate Application Key

```bash
php artisan key:generate
```

### 5. Jalankan Migration

Jalankan migration untuk membuat semua tabel:

```bash
php artisan migrate
```

Output yang diharapkan:
```
Migration table created successfully.
Migrating: 2024_01_01_000001_create_pengguna_table
Migrated:  2024_01_01_000001_create_pengguna_table (50.23ms)
Migrating: 2024_01_01_000002_create_ujian_table
Migrated:  2024_01_01_000002_create_ujian_table (45.67ms)
...
```

### 6. Setup Storage Link

Buat symbolic link untuk akses file upload:

```bash
php artisan storage:link
```

Pastikan folder `storage/app/public/proctoring` ada:

```bash
mkdir -p storage/app/public/proctoring
```

### 7. Seed Database (Optional)

Isi database dengan data sample:

```bash
php artisan db:seed
```

Data sample yang akan dibuat:
- 1 Admin (username: `admin`, password: `password`)
- 4 Peserta (username: `peserta_001`, `peserta_002`, dll, password: `password`)
- 3 Ujian sample
- Soal-soal pilihan ganda
- Log proctoring sample

### 8. Jalankan Server

```bash
php artisan serve
```

Server akan berjalan di: `http://localhost:8000`

---

## Testing API

### Menggunakan Postman

#### 1. Test Insert Log Proctoring

**Request:**
- Method: `POST`
- URL: `http://localhost:8000/api/proctoring/log`
- Body (form-data):
  - `id_user`: `2`
  - `id_rekam_jejak`: `1`
  - `jenis_pelanggaran`: `No Face`
  - `bukti_screenshot`: (upload file gambar)
  - `keterangan`: `Test dari Postman`

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Log proctoring berhasil disimpan",
  "data": {
    "id_log": 14,
    "timestamp": "2026-10-10 12:30:45",
    "jenis_pelanggaran": "No Face",
    "screenshot_url": "http://localhost:8000/storage/proctoring/..."
  }
}
```

#### 2. Test Get Laporan Admin

**Request:**
- Method: `GET`
- URL: `http://localhost:8000/api/admin/laporan/proctoring/eloquent`

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Data laporan berhasil diambil (Eloquent ORM)",
  "data": [...]
}
```

### Menggunakan cURL

```bash
# Insert log dengan file upload
curl -X POST http://localhost:8000/api/proctoring/log \
  -F "id_user=2" \
  -F "id_rekam_jejak=1" \
  -F "jenis_pelanggaran=No Face" \
  -F "bukti_screenshot=@/path/to/screenshot.png" \
  -F "keterangan=Test curl"

# Get laporan
curl -X GET http://localhost:8000/api/admin/laporan/proctoring/raw
```

---

## Troubleshooting

### Error: SQLSTATE[HY000] [2002] Connection refused

**Solusi:**
- Pastikan MySQL/MariaDB sudah running
- Cek kredensial di file `.env`
- Cek port MySQL (default: 3306)

```bash
# Windows (XAMPP/Laragon)
# Start MySQL dari control panel

# Linux
sudo systemctl start mysql

# macOS
brew services start mysql
```

### Error: Storage link not found

**Solusi:**
```bash
php artisan storage:link
```

### Error: Class 'App\Models\...' not found

**Solusi:**
```bash
composer dump-autoload
```

### Permission Error (Linux/macOS)

**Solusi:**
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### Migration Already Exists

**Reset migration (HATI-HATI: akan hapus semua data):**
```bash
php artisan migrate:fresh
```

Atau rollback saja:
```bash
php artisan migrate:rollback
php artisan migrate
```

---

## Command Cheat Sheet

```bash
# Lihat status migration
php artisan migrate:status

# Rollback migration terakhir
php artisan migrate:rollback

# Rollback semua migration
php artisan migrate:reset

# Fresh migration + seed
php artisan migrate:fresh --seed

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Lihat semua route
php artisan route:list

# Generate model + migration + controller
php artisan make:model NamaModel -mcr
```

---

## Default Credentials (Setelah Seed)

### Admin
- Username: `admin`
- Password: `password`
- Email: `admin@cat-system.test`

### Peserta
- Username: `peserta_001` / `peserta_002` / `peserta_003` / `peserta_004`
- Password: `password`
- Email: `dany@student.test` / `shandy@student.test` / dll

---

## Database Structure Overview

```
pengguna (5 rows)
├── ujian (3 rows)
│   └── soal (5 rows)
│       
├── rekam_jejak (3 rows)
    ├── jawaban_peserta (3 rows)
    └── log_proctoring (13 rows)
```

---

## Next Steps

1. **Frontend Integration**
   - Setup camera access dengan `getUserMedia()`
   - Kirim frame ke AI model setiap 3 detik
   - Call API `/api/proctoring/log` untuk insert log

2. **AI Model Integration**
   - Integrate Face API atau model sendiri
   - Deteksi wajah (Normal, No Face, Multiple Faces)
   - Return hasil deteksi ke backend

3. **Admin Dashboard**
   - Buat halaman untuk call endpoint laporan
   - Tampilkan tabel log proctoring
   - Filter dan statistik

4. **Security Enhancement**
   - Tambahkan authentication middleware
   - Rate limiting untuk API
   - CORS configuration
   - Encrypt sensitive data

