# Sistem CAT (Computer Adaptive Test) dengan Deteksi Kecurangan

Dokumentasi lengkap implementasi backend untuk Sistem CAT dengan fitur proctoring berbasis AI.

---

## Daftar Isi

1. [Struktur Database](#struktur-database)
2. [Instalasi](#instalasi)
3. [Migration](#migration)
4. [API Endpoints](#api-endpoints)
5. [Contoh Request & Response](#contoh-request--response)
6. [Query Examples](#query-examples)

---

## Struktur Database

### Tabel yang Dibuat:
1. **PENGGUNA** - Data user (Admin & Peserta)
2. **UJIAN** - Data ujian/mata kuliah
3. **SOAL** - Soal pilihan ganda dengan kunci jawaban
4. **REKAM_JEJAK** - Rekaman aktivitas peserta per ujian
5. **JAWABAN_PESERTA** - Jawaban yang dipilih peserta
6. **LOG_PROCTORING** - Log deteksi kecurangan dari AI

### Relasi:
- `SOAL` → `UJIAN` (Many to One, CASCADE)
- `REKAM_JEJAK` → `PENGGUNA` (Many to One, CASCADE)
- `REKAM_JEJAK` → `UJIAN` (Many to One, CASCADE)
- `JAWABAN_PESERTA` → `REKAM_JEJAK` (Many to One, CASCADE)
- `JAWABAN_PESERTA` → `SOAL` (Many to One, CASCADE)
- `LOG_PROCTORING` → `REKAM_JEJAK` (Many to One, CASCADE)
- `LOG_PROCTORING` → `PENGGUNA` (Many to One, CASCADE)

---

## Instalasi

### 1. Persiapan Database

Buat database baru di MySQL:
```sql
CREATE DATABASE cat_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Konfigurasi `.env`

Update file `.env` Laravel:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cat_system
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Jalankan Migration

```bash
php artisan migrate
```

File migration akan dijalankan sesuai urutan timestamp:
- `2024_01_01_000001_create_pengguna_table.php`
- `2024_01_01_000002_create_ujian_table.php`
- `2024_01_01_000003_create_soal_table.php`
- `2024_01_01_000004_create_rekam_jejak_table.php`
- `2024_01_01_000005_create_jawaban_peserta_table.php`
- `2024_01_01_000006_create_log_proctoring_table.php`

### 4. Setup Storage

```bash
php artisan storage:link
```

Ini membuat symbolic link dari `storage/app/public` ke `public/storage` agar screenshot bisa diakses via URL.

---

## API Endpoints

### **1. Insert Log Proctoring**

**Endpoint:** `POST /api/proctoring/log`

**Deskripsi:** Dipanggil dari frontend/AI setiap 3 detik untuk mencatat aktivitas peserta.

**Request Body (multipart/form-data):**
```json
{
  "id_user": 2,
  "id_rekam_jejak": 1,
  "jenis_pelanggaran": "No Face",
  "bukti_screenshot": <file_gambar>,
  "keterangan": "Wajah tidak terdeteksi selama 3 detik"
}
```

**Validasi:**
- `id_user`: required, integer, must exist in pengguna table
- `id_rekam_jejak`: required, integer, must exist in rekam_jejak table
- `jenis_pelanggaran`: required, enum (Normal, No Face, Multiple Faces, Looking Away, Suspicious Activity)
- `bukti_screenshot`: optional, image (jpeg/png/jpg), max 2MB
- `keterangan`: optional, string, max 500 chars

**Response Success (201):**
```json
{
  "success": true,
  "message": "Log proctoring berhasil disimpan",
  "data": {
    "id_log": 123,
    "timestamp": "2026-10-10 12:30:45",
    "jenis_pelanggaran": "No Face",
    "screenshot_url": "http://localhost:8000/storage/proctoring/proctoring_2_1728561045_abc123.png"
  }
}
```

**Response Error (422):**
```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": {
    "id_user": ["ID Peserta wajib diisi"],
    "jenis_pelanggaran": ["Jenis pelanggaran tidak valid"]
  }
}
```

---

### **2. Insert Log dengan Base64**

**Endpoint:** `POST /api/proctoring/log/base64`

**Deskripsi:** Alternative untuk frontend yang mengirim screenshot dalam format base64.

**Request Body (JSON):**
```json
{
  "id_user": 2,
  "id_rekam_jejak": 1,
  "jenis_pelanggaran": "Multiple Faces",
  "bukti_screenshot_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEU...",
  "keterangan": "Terdeteksi 2 wajah"
}
```

---

### **3. Get Laporan Dashboard Admin (Raw SQL)**

**Endpoint:** `GET /api/admin/laporan/proctoring/raw`

**Deskripsi:** Menampilkan semua log proctoring dengan informasi lengkap menggunakan Raw SQL.

**Response:**
```json
{
  "success": true,
  "message": "Data laporan berhasil diambil (Raw SQL)",
  "data": [
    {
      "id_log": 5,
      "nama_peserta": "Achmaddany Rozaqy",
      "username_peserta": "peserta_001",
      "waktu_kejadian": "2026-10-10 12:30:45",
      "jenis_pelanggaran": "No Face",
      "path_bukti": "proctoring/proctoring_2_1728561045.png",
      "url_bukti": "http://localhost:8000/storage/proctoring/proctoring_2_1728561045.png",
      "keterangan": "Wajah tidak terdeteksi",
      "mata_kuliah": "Pemrograman Web Lanjut",
      "skor": 85.50
    }
  ]
}
```

---

### **4. Get Laporan Pelanggaran Saja (Raw SQL)**

**Endpoint:** `GET /api/admin/laporan/pelanggaran/raw`

**Deskripsi:** Filter hanya log yang berisi pelanggaran (bukan "Normal").

---

### **5. Get Laporan Dashboard Admin (Eloquent)**

**Endpoint:** `GET /api/admin/laporan/proctoring/eloquent`

**Deskripsi:** Sama seperti endpoint raw SQL, tapi menggunakan Eloquent ORM.

---

### **6. Get Laporan Pelanggaran (Eloquent)**

**Endpoint:** `GET /api/admin/laporan/pelanggaran/eloquent`

---

### **7. Get Statistik Pelanggaran Per Peserta**

**Endpoint:** `GET /api/admin/statistik/pelanggaran`

**Response:**
```json
{
  "success": true,
  "message": "Statistik pelanggaran per peserta",
  "data": {
    "raw_sql": [...],
    "eloquent": [
      {
        "id_user": 2,
        "nama_lengkap": "Achmaddany Rozaqy",
        "username": "peserta_001",
        "total_no_face": 5,
        "total_multiple_faces": 2,
        "total_looking_away": 1,
        "total_suspicious": 0,
        "total_pelanggaran": 8
      }
    ]
  }
}
```

---

### **8. Get Detail Log Satu Peserta**

**Endpoint:** `GET /api/admin/peserta/{idUser}/logs`

**Contoh:** `GET /api/admin/peserta/2/logs`

**Response:**
```json
{
  "success": true,
  "data": {
    "peserta": {
      "id_user": 2,
      "nama_lengkap": "Achmaddany Rozaqy",
      "username": "peserta_001",
      "email": "dany@student.test"
    },
    "total_log": 15,
    "total_pelanggaran": 8,
    "logs": [...]
  }
}
```

---

## Contoh Request & Response

### Contoh Request dari Frontend (JavaScript)

```javascript
// Setup setiap 3 detik
setInterval(async () => {
  const formData = new FormData();
  formData.append('id_user', userId);
  formData.append('id_rekam_jejak', rekamJejakId);
  formData.append('jenis_pelanggaran', violationType);
  
  // Capture screenshot dari video
  const canvas = document.createElement('canvas');
  const video = document.getElementById('cameraStream');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  
  canvas.toBlob(async (blob) => {
    formData.append('bukti_screenshot', blob, 'screenshot.png');
    
    await fetch('/api/proctoring/log', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });
  }, 'image/png');
}, 3000);
```

### Contoh dengan Base64

```javascript
// Kirim base64
const base64Screenshot = canvas.toDataURL('image/png');

await fetch('/api/proctoring/log/base64', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    id_user: userId,
    id_rekam_jejak: rekamJejakId,
    jenis_pelanggaran: violationType,
    bukti_screenshot_base64: base64Screenshot,
    keterangan: 'Deteksi otomatis dari AI'
  })
});
```

---

## 🔍 Query Examples

### Query SQL Murni

File: `database/queries_dashboard_admin.sql`

**Query 1: Laporan Lengkap**
```sql
SELECT 
    lp.id_log,
    p.nama_lengkap AS nama_peserta,
    lp.timestamp AS waktu_kejadian,
    lp.jenis_pelanggaran,
    lp.bukti_screenshot AS path_bukti,
    u.judul_mata_kuliah
FROM log_proctoring lp
INNER JOIN pengguna p ON lp.id_user = p.id_user
INNER JOIN rekam_jejak rj ON lp.id_rekam_jejak = rj.id_rekam_jejak
INNER JOIN ujian u ON rj.id_ujian = u.id_ujian
ORDER BY lp.timestamp DESC;
```

**Query 2: Filter Hanya Pelanggaran**
```sql
WHERE lp.jenis_pelanggaran IN ('No Face', 'Multiple Faces', 'Looking Away', 'Suspicious Activity')
```

**Query 3: Statistik Per Peserta**
```sql
SELECT 
    p.nama_lengkap,
    COUNT(CASE WHEN lp.jenis_pelanggaran = 'No Face' THEN 1 END) as total_no_face,
    COUNT(CASE WHEN lp.jenis_pelanggaran = 'Multiple Faces' THEN 1 END) as total_multiple_faces,
    COUNT(CASE WHEN lp.jenis_pelanggaran != 'Normal' THEN 1 END) as total_pelanggaran
FROM pengguna p
LEFT JOIN log_proctoring lp ON p.id_user = lp.id_user
GROUP BY p.id_user
ORDER BY total_pelanggaran DESC;
```

### Eloquent ORM

```php
// Get semua log dengan relasi
$logs = LogProctoring::with(['pengguna', 'rekamJejak.ujian'])
    ->orderBy('timestamp', 'desc')
    ->get();

// Filter hanya pelanggaran
$logs = LogProctoring::with(['pengguna', 'rekamJejak.ujian'])
    ->pelanggaran() // scope dari model
    ->orderBy('timestamp', 'desc')
    ->get();

// Statistik per peserta
$stats = Pengguna::peserta()
    ->withCount([
        'logProctoring as total_no_face' => function($query) {
            $query->where('jenis_pelanggaran', 'No Face');
        },
        'logProctoring as total_pelanggaran' => function($query) {
            $query->where('jenis_pelanggaran', '!=', 'Normal');
        }
    ])
    ->having('total_pelanggaran', '>', 0)
    ->orderBy('total_pelanggaran', 'desc')
    ->get();
```

---

## Struktur File yang Dibuat

```
CAT_V1/
├── app/
│   ├── Models/
│   │   ├── Pengguna.php
│   │   ├── Ujian.php
│   │   ├── Soal.php
│   │   ├── RekamJejak.php
│   │   ├── JawabanPeserta.php
│   │   └── LogProctoring.php
│   └── Http/Controllers/
│       ├── ProctoringController.php
│       └── AdminDashboardController.php
├── database/
│   ├── migrations/
│   │   ├── 2024_01_01_000001_create_pengguna_table.php
│   │   ├── 2024_01_01_000002_create_ujian_table.php
│   │   ├── 2024_01_01_000003_create_soal_table.php
│   │   ├── 2024_01_01_000004_create_rekam_jejak_table.php
│   │   ├── 2024_01_01_000005_create_jawaban_peserta_table.php
│   │   └── 2024_01_01_000006_create_log_proctoring_table.php
│   ├── schema_cat_system.sql
│   └── queries_dashboard_admin.sql
└── routes/
    └── api.php
```

---

## Checklist Implementasi

- [x] Skema database 6 tabel dengan relasi CASCADE
- [x] File migration Laravel lengkap
- [x] Model Eloquent dengan relasi
- [x] ProctoringController dengan insertLog()
- [x] Validasi request lengkap
- [x] Upload screenshot (file & base64)
- [x] AdminDashboardController dengan query SQL & Eloquent
- [x] API routes lengkap
- [x] Dokumentasi lengkap

---

## Fitur Utama

1. **Insert Log Proctoring**
   - Dipanggil setiap 3 detik dari frontend
   - Validasi ketat untuk data integrity
   - Support file upload & base64
   - Auto timestamp

2. **Dashboard Admin**
   - Query SQL murni (Raw SQL)
   - Query Eloquent ORM
   - Query Builder
   - Statistik per peserta
   - Filter pelanggaran vs normal

3. **Database Design**
   - Foreign key dengan CASCADE
   - Index untuk performa
   - Enum untuk consistency
   - Timestamp otomatis
