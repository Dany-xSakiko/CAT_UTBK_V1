# Database Setup - phpMyAdmin

## Status: Database Berhasil Di-Import!

Database `cat_system` sudah berhasil dibuat dan di-import ke MySQL Laragon.

---

## Informasi Database

**Database Name:** `cat_system`  
**Character Set:** `utf8mb4`  
**Collation:** `utf8mb4_unicode_ci`  
**Total Tables:** 6

### Tabel yang Sudah Dibuat:

1. **pengguna** - 3 rows (1 admin, 2 peserta)
2. **ujian** - 2 rows
3. **soal** - 0 rows (belum ada soal)
4. **rekam_jejak** - 0 rows
5. **jawaban_peserta** - 0 rows
6. **log_proctoring** - 0 rows

---

## Akses phpMyAdmin

### URL:
```
http://localhost/phpmyadmin
```
atau
```
http://127.0.0.1/phpmyadmin
```

### Credentials:
- **Username:** `root`
- **Password:** *(kosong - no password)*

### Database:
- Pilih database: **cat_system**

---

## Default Users (Sample Data)

### Admin:
- **Username:** `admin`
- **Password:** `$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi` (hashed: `password`)
- **Nama:** Administrator
- **Email:** admin@cat-system.test

### Peserta:
**Peserta 1:**
- **Username:** `peserta_001`
- **Password:** `password` (hashed)
- **Nama:** Achmaddany Rozaqy
- **Email:** dany@student.test

**Peserta 2:**
- **Username:** `peserta_002`
- **Password:** `password` (hashed)
- **Nama:** Shandy Prasetyo
- **Email:** shandy@student.test

---

## Data Ujian

**Ujian 1:**
- **Mata Kuliah:** Pemrograman Web Lanjut
- **Tanggal:** 2026-10-15
- **Waktu:** 08:00 - 10:00
- **Durasi:** 120 menit
- **Status:** Aktif 

**Ujian 2:**
- **Mata Kuliah:** Basis Data
- **Tanggal:** 2026-10-16
- **Waktu:** 13:00 - 15:00
- **Durasi:** 120 menit
- **Status:** Tidak Aktif 

---

## Query Test di phpMyAdmin

Buka tab SQL di phpMyAdmin dan coba query ini:

### 1. Lihat Semua User
```sql
SELECT id_user, username, nama_lengkap, role, email 
FROM pengguna;
```

### 2. Lihat Semua Ujian
```sql
SELECT * FROM ujian;
```

### 3. Cek Foreign Key Constraints
```sql
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'cat_system' 
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### 4. Cek Structure Tabel log_proctoring
```sql
DESCRIBE log_proctoring;
```

---

## Test Insert Log Proctoring

Kamu bisa test insert manual di phpMyAdmin:

```sql
-- Pertama buat rekam_jejak dulu
INSERT INTO rekam_jejak (id_user, id_ujian, waktu_mulai, status_pengerjaan)
VALUES (2, 1, NOW(), 'sedang_mengerjakan');

-- Lalu insert log proctoring
INSERT INTO log_proctoring (id_rekam_jejak, id_user, jenis_pelanggaran, keterangan)
VALUES (1, 2, 'No Face', 'Test manual dari phpMyAdmin');

-- Lihat hasilnya
SELECT 
    lp.id_log,
    p.nama_lengkap,
    lp.timestamp,
    lp.jenis_pelanggaran,
    u.judul_mata_kuliah
FROM log_proctoring lp
JOIN pengguna p ON lp.id_user = p.id_user
JOIN rekam_jejak rj ON lp.id_rekam_jejak = rj.id_rekam_jejak
JOIN ujian u ON rj.id_ujian = u.id_ujian;
```

---

## Catatan Penting

1. **Foreign Key Cascade:** Sudah aktif. Kalau hapus user, semua log-nya ikut terhapus otomatis.

2. **Enum Jenis Pelanggaran:**
   - Normal
   - No Face
   - Multiple Faces
   - Looking Away
   - Suspicious Activity

3. **Timestamp Otomatis:** Kolom `timestamp` dan `created_at` otomatis terisi saat insert.

4. **Index:** Sudah dibuat untuk performa query (id_user, id_ujian, timestamp, jenis_pelanggaran).

---

## Kalau Mau Reset Database

```sql
-- Hapus semua data tapi pertahankan struktur
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE log_proctoring;
TRUNCATE TABLE jawaban_peserta;
TRUNCATE TABLE rekam_jejak;
TRUNCATE TABLE soal;
TRUNCATE TABLE ujian;
TRUNCATE TABLE pengguna;
SET FOREIGN_KEY_CHECKS=1;

-- Atau hapus database dan import ulang
DROP DATABASE cat_system;
CREATE DATABASE cat_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cat_system;
SOURCE D:\kuliah semester 7\capstone project\CAT_V1\database\schema_cat_system.sql;
```

---

## Next Steps

1. Database sudah ready di phpMyAdmin
2. Tambah soal untuk ujian (manual via phpMyAdmin atau Laravel Seeder)
3. Setup `.env` Laravel untuk koneksi database
4. Jalankan `php artisan migrate` (optional, karena tabel sudah ada)
5. Test API dengan Postman

---

## Lokasi File

- **Schema SQL:** `D:\kuliah semester 7\capstone project\CAT_V1\database\schema_cat_system.sql`
- **Queries Admin:** `D:\kuliah semester 7\capstone project\CAT_V1\database\queries_dashboard_admin.sql`
- **MySQL Path:** `C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe`

---

**Database sudah siap pakai! Buka phpMyAdmin dan explore datanya! 🎉**
