# SUMMARY IMPLEMENTASI SISTEM CAT

**Dibuat untuk:** Tugas Akhir S1 - Kelompok 2  
**Tanggal:** 10 Oktober 2026  
**Topik:** Computer Assisted Test (CAT) dengan Deteksi Kecurangan Berbasis AI

---

## Yang Sudah Dikerjakan

### 1. **Skema Database (6 Tabel)**
✓ File: `database/schema_cat_system.sql`

**Tabel yang dibuat:**
- `PENGGUNA` - User dengan role Admin/Peserta
- `UJIAN` - Data ujian dan jadwal
- `SOAL` - Soal pilihan ganda (A-E) dengan kunci jawaban
- `REKAM_JEJAK` - Tracking aktivitas peserta per ujian
- `JAWABAN_PESERTA` - Jawaban yang dipilih peserta
- `LOG_PROCTORING` - Log deteksi kecurangan dari AI/kamera

**Fitur Database:**
- ✓ Foreign Key dengan ON DELETE CASCADE & ON UPDATE CASCADE
- ✓ Index untuk performa query
- ✓ ENUM untuk data consistency
- ✓ Timestamp otomatis
- ✓ Unique constraint untuk data integrity
- ✓ Sample data untuk testing

---

### 2. **Migration Laravel (6 Files)**
✓ Folder: `database/migrations/`

Semua migration dibuat dengan urutan dependency yang benar:
1. `2024_01_01_000001_create_pengguna_table.php`
2. `2024_01_01_000002_create_ujian_table.php`
3. `2024_01_01_000003_create_soal_table.php`
4. `2024_01_01_000004_create_rekam_jejak_table.php`
5. `2024_01_01_000005_create_jawaban_peserta_table.php`
6. `2024_01_01_000006_create_log_proctoring_table.php`

**Cara Jalankan:**
```bash
php artisan migrate
```

---

### 3. **Model Eloquent (6 Files)**
✓ Folder: `app/Models/`

**File yang dibuat:**
- `Pengguna.php` - Model untuk user (Admin & Peserta)
- `Ujian.php` - Model untuk ujian
- `Soal.php` - Model untuk soal
- `RekamJejak.php` - Model untuk tracking peserta
- `JawabanPeserta.php` - Model untuk jawaban
- `LogProctoring.php` - Model untuk log kecurangan

**Fitur Model:**
- ✓ Relasi lengkap (One to Many, Many to One)
- ✓ Scope methods (pelanggaran(), normal(), admin(), peserta())
- ✓ Helper methods (hitungSkor(), cekJawaban(), isJawabanBenar())
- ✓ Accessor untuk URL screenshot
- ✓ Protected attributes & casting

---

### 4. **ProctoringController**
✓ File: `app/Http/Controllers/ProctoringController.php`

**Method yang dibuat:**

#### a. `insertLog()` - Insert log dari frontend/AI
**Endpoint:** `POST /api/proctoring/log`

**Fitur:**
- ✓ Validasi ketat (id_user, id_rekam_jejak, jenis_pelanggaran)
- ✓ Upload screenshot (file upload)
- ✓ Verifikasi rekam jejak milik user yang bersangkutan
- ✓ Cek status ujian masih berlangsung
- ✓ Auto timestamp
- ✓ Error handling & logging
- ✓ Response JSON terstruktur

**Request Format:**
```json
{
  "id_user": 2,
  "id_rekam_jejak": 1,
  "jenis_pelanggaran": "No Face",
  "bukti_screenshot": <file>,
  "keterangan": "Optional"
}
```

#### b. `insertLogBase64()` - Alternative dengan base64
**Endpoint:** `POST /api/proctoring/log/base64`

Sama seperti insertLog() tapi menerima screenshot dalam format base64 (untuk frontend yang kirim gambar sebagai string).

#### c. `getLogsByRekamJejak()` - Get logs per rekam jejak
**Endpoint:** `GET /api/proctoring/logs/{idRekamJejak}`

---

### 5. **AdminDashboardController**
✓ File: `app/Http/Controllers/AdminDashboardController.php`

**Method yang dibuat:**

#### a. `getLaporanProctoringRawSQL()` - Raw SQL
**Endpoint:** `GET /api/admin/laporan/proctoring/raw`
- Query SQL murni dengan JOIN 4 tabel
- Menampilkan: ID Log, Nama Peserta, Waktu, Jenis Pelanggaran, Path Screenshot, Mata Kuliah, Skor

#### b. `getLaporanPelanggaranRawSQL()` - Filter pelanggaran (Raw SQL)
**Endpoint:** `GET /api/admin/laporan/pelanggaran/raw`
- Hanya tampilkan log yang bukan "Normal"

#### c. `getLaporanProctoringEloquent()` - Eloquent ORM
**Endpoint:** `GET /api/admin/laporan/proctoring/eloquent`
- Sama dengan raw SQL tapi pakai Eloquent
- Menggunakan relasi model (with())

#### d. `getLaporanPelanggaranEloquent()` - Filter pelanggaran (Eloquent)
**Endpoint:** `GET /api/admin/laporan/pelanggaran/eloquent`
- Pakai scope pelanggaran() dari model

#### e. `getLaporanProctoringQueryBuilder()` - Query Builder
**Endpoint:** `GET /api/admin/laporan/proctoring/builder`
- Alternative dengan DB facade

#### f. `getStatistikPelanggaranPerPeserta()` - Statistik
**Endpoint:** `GET /api/admin/statistik/pelanggaran`
- Hitung total pelanggaran per jenis per peserta
- Versi Raw SQL & Eloquent

#### g. `getLaporanDetailPeserta()` - Detail satu peserta
**Endpoint:** `GET /api/admin/peserta/{idUser}/logs`
- Semua log dari satu peserta
- Info peserta + total pelanggaran

---

### 6. **Query SQL Examples**
✓ File: `database/queries_dashboard_admin.sql`

**7 Query siap pakai:**
1. Laporan log lengkap dengan JOIN
2. Filter hanya pelanggaran
3. Statistik pelanggaran per peserta
4. Laporan per ujian
5. Detail log satu peserta
6. Top 10 peserta dengan pelanggaran terbanyak
7. Log hari ini saja

---

### 7. **API Routes**
✓ File: `routes/api.php`

**Semua endpoint terdaftar:**
- POST `/api/proctoring/log`
- POST `/api/proctoring/log/base64`
- GET `/api/proctoring/logs/{id}`
- GET `/api/admin/laporan/proctoring/raw`
- GET `/api/admin/laporan/pelanggaran/raw`
- GET `/api/admin/laporan/proctoring/eloquent`
- GET `/api/admin/laporan/pelanggaran/eloquent`
- GET `/api/admin/laporan/proctoring/builder`
- GET `/api/admin/statistik/pelanggaran`
- GET `/api/admin/peserta/{id}/logs`

---

### 8. **Request Validation**
✓ File: `app/Http/Requests/StoreProctoringLogRequest.php`

Form Request terpisah untuk validasi insertLog dengan:
- ✓ Rules validation
- ✓ Custom error messages (Bahasa Indonesia)
- ✓ Custom attributes

---

### 9. **Database Seeder**
✓ File: `database/seeders/DatabaseSeeder.php`

**Sample data yang dibuat:**
- 1 Admin + 4 Peserta (password: `password`)
- 3 Ujian sample
- 5 Soal pilihan ganda
- 3 Rekam jejak (2 selesai, 1 sedang mengerjakan)
- 3 Jawaban peserta
- 13 Log proctoring (mix Normal & Pelanggaran)

**Cara jalankan:**
```bash
php artisan db:seed
```

---

### 10. **Dokumentasi Lengkap**

#### a. README_IMPLEMENTASI.md
- Overview sistem
- Struktur database & relasi
- API endpoints & cara pakai
- Contoh request/response
- Query examples
- Checklist fitur

#### b. INSTALLATION_GUIDE.md
- Prerequisites
- Step-by-step instalasi
- Setup database
- Migration & seeding
- Testing API dengan Postman/cURL
- Troubleshooting common errors
- Command cheat sheet
- Default credentials

---

## Struktur File Akhir

```
CAT_V1/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AdminDashboardController.php    ✓ 12 KB
│   │   │   └── ProctoringController.php         ✓ 11 KB
│   │   └── Requests/
│   │       └── StoreProctoringLogRequest.php    ✓ 3 KB
│   └── Models/
│       ├── Pengguna.php                         ✓ 1 KB
│       ├── Ujian.php                            ✓ 1 KB
│       ├── Soal.php                             ✓ 1 KB
│       ├── RekamJejak.php                       ✓ 2 KB
│       ├── JawabanPeserta.php                   ✓ 1 KB
│       └── LogProctoring.php                    ✓ 2 KB
├── database/
│   ├── migrations/
│   │   ├── 2024_01_01_000001_create_pengguna_table.php        ✓
│   │   ├── 2024_01_01_000002_create_ujian_table.php          ✓
│   │   ├── 2024_01_01_000003_create_soal_table.php           ✓
│   │   ├── 2024_01_01_000004_create_rekam_jejak_table.php    ✓
│   │   ├── 2024_01_01_000005_create_jawaban_peserta_table.php ✓
│   │   └── 2024_01_01_000006_create_log_proctoring_table.php  ✓
│   ├── seeders/
│   │   └── DatabaseSeeder.php                   ✓ 12 KB
│   ├── schema_cat_system.sql                    ✓ 6 KB
│   └── queries_dashboard_admin.sql              ✓ 4 KB
├── routes/
│   └── api.php                                  ✓ 2 KB
├── README_IMPLEMENTASI.md                       ✓ 12 KB
├── INSTALLATION_GUIDE.md                        ✓ 6 KB
└── Kerangka_UTBK_Capstone Project_Kelompok 2.pdf

TOTAL: 20+ files dibuat
```

---

## Yang Sudah Sesuai Requirements

### Requirement 1: Skema Database Relasional
- [x] 6 tabel dengan tipe data optimal
- [x] Foreign Key dengan CASCADE
- [x] Relasi benar (Many to One, One to Many)
- [x] ENUM untuk role & status
- [x] Index untuk performa

### Requirement 2: Logika Backend insertLog()
- [x] Method insertLog() di ProctoringController
- [x] Menerima request dari frontend/AI setiap 3 detik
- [x] Menyimpan: ID Peserta, Timestamp otomatis, Jenis Pelanggaran, Bukti Screenshot
- [x] Validasi request lengkap dengan error messages
- [x] Support file upload & base64

### Requirement 3: Query Integrasi Dashboard Admin
- [x] SQL Join murni (Raw SQL)
- [x] Eloquent ORM version
- [x] Menampilkan: ID Log, Nama Peserta, Waktu Kejadian, Jenis Pelanggaran, Path Screenshot
- [x] Urutkan descending (terbaru di atas)
- [x] Bonus: Query Builder, Statistik, Filter

---

## Cara Pakai (Quick Start)

### 1. Setup Database
```bash
# Buat database
mysql -u root -p
CREATE DATABASE cat_system;
exit;

# Update .env
DB_DATABASE=cat_system
```

### 2. Jalankan Migration
```bash
php artisan migrate
```

### 3. Isi Sample Data
```bash
php artisan db:seed
```

### 4. Setup Storage
```bash
php artisan storage:link
```

### 5. Jalankan Server
```bash
php artisan serve
```

### 6. Test API
```bash
# Test insert log
curl -X POST http://localhost:8000/api/proctoring/log \
  -F "id_user=2" \
  -F "id_rekam_jejak=1" \
  -F "jenis_pelanggaran=No Face"

# Test get laporan
curl http://localhost:8000/api/admin/laporan/proctoring/eloquent
```

---

## Tips untuk Frontend Integration

### JavaScript Example (Camera + AI Detection)
```javascript
// Setiap 3 detik
setInterval(async () => {
  // Capture frame dari camera
  const screenshot = captureScreenshot();
  
  // Kirim ke AI untuk deteksi
  const detection = await detectFace(screenshot);
  
  // Insert log ke backend
  const formData = new FormData();
  formData.append('id_user', currentUserId);
  formData.append('id_rekam_jejak', rekamJejakId);
  formData.append('jenis_pelanggaran', detection.type);
  formData.append('bukti_screenshot', screenshot);
  
  await fetch('/api/proctoring/log', {
    method: 'POST',
    body: formData
  });
}, 3000);
```

---

## Default Login (Setelah Seed)

**Admin:**
- Username: `admin`
- Password: `password`

**Peserta:**
- Username: `peserta_001`, `peserta_002`, dll
- Password: `password`

---

## Catatan untuk Presentasi Tugas Akhir

**Yang bisa kamu tunjukkan:**
1. **ERD Database** - 6 tabel dengan relasi CASCADE
2. **Migration Laravel** - Auto create semua tabel
3. **Model Eloquent** - OOP approach dengan relasi
4. **API insertLog()** - Validasi ketat, support file upload
5. **Dashboard Query** - Raw SQL vs Eloquent vs Query Builder
6. **Sample Data** - Langsung bisa demo dengan seed
7. **Documentation** - Lengkap dengan examples

**Highlight Technical:**
- Foreign Key Cascade untuk data integrity
- Index untuk performa query
- Eloquent relationships untuk maintainability
- Form Request Validation untuk security
- Error handling & logging
- RESTful API design

---

## Bonus Features

Yang sudah ditambahkan di luar requirements:
- [x] Base64 screenshot support
- [x] Query Builder alternative
- [x] Statistik pelanggaran per peserta
- [x] Detail log per peserta
- [x] Scope methods di Model
- [x] Helper methods (hitungSkor, cekJawaban)
- [x] Form Request Validation terpisah
- [x] Complete error handling
- [x] Logging untuk debugging
- [x] Sample data seeder
- [x] Installation guide
- [x] API documentation

---

## Next Steps

1. **Frontend Development**
   - Setup camera access
   - Integrate Face Detection AI
   - Call API insertLog setiap 3 detik

2. **Admin Dashboard UI**
   - Buat tampilan tabel laporan
   - Chart statistik pelanggaran
   - Filter & search

3. **Authentication**
   - Implement login system
   - JWT atau Laravel Sanctum
   - Middleware untuk protect routes

4. **Testing**
   - Unit test untuk Model
   - Feature test untuk API
   - Integration test

---

**Semua requirements sudah selesai! Tinggal integrate dengan frontend dan AI model. Good luck! 🚀**
