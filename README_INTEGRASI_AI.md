# Dokumentasi Integrasi Model AI Computer Vision ke CAT UTBK V1

Dokumen ini mencatat rincian pemasukan modul AI Computer Vision dari folder `cat_proctoring` ke dalam aplikasi utama `CAT_UTBK_V1`.

---

## 1. Ringkasan & Ruang Lingkup

Integrasi ini bertujuan melengkapi aplikasi **CAT UTBK V1** (React 19 + Laravel) dengan kemampuan pengawasan ujian otomatis (*automated proctoring*) berbasis kecerdasan buatan, menggunakan model **BlazeFace + TensorFlow.js** yang telah diriset pada folder `cat_proctoring`.

### Kode yang Dimasukkan:
- **Modul AI Browser**: Model CNN BlazeFace, algoritma prapemrosesan kontras/kecerahan, pascapemrosesan *Non-Maximum Suppression* (NMS), deteksi ukuran wajah minimum, dan gerbang toleransi anomali (*Anomaly Gate*).
- **Hook Proctoring React**: Siklus pemantauan berkala (tiap 3 detik), deteksi perpindahan tab browser (*Looking Away*), pemicu peringatan ke antarmuka, dan pengiriman bukti tangkapan layar berformat JPEG ke API backend.
- **Normalisasi Backend**: Adaptasi parameter fleksibel pada `ProctoringController` di Laravel agar menerima format payload dari modul AI secara mulus.

### Kode yang Ditinggalkan / Tidak Dimasukkan:
- Eksperimen lama berbasis Python di `cat_proctoring` (`ai/detector.py`, `faces/`, `scripts/`, `api/`, `requirements.txt`) yang menggunakan OpenCV Haar Cascade dan FastAPI tidak dimasukkan karena arsitektur resmi yang disepakati adalah **deteksi di sisi peramban peserta (client-side inference)**, bukan server-side processing.
- Berkas pengujian lokal dan direktori dataset dummy (`dataset_uji/`, `screenshots/`, `.pytest_cache`) diabaikan untuk menjaga basis kode `CAT_UTBK_V1` tetap bersih dan siap produksi.

---

## 2. Arsitektur AI & Computer Vision

### Mengapa BlazeFace + TensorFlow.js di Browser?
1. **Beban Server Rendah**: Analisis video berlangsung di perangkat lokal masing-masing peserta. Server tidak perlu menerima streaming video terus-menerus, menghemat bandwidth jaringan dan kapasitas CPU server secara signifikan.
2. **Privasi & Efisiensi Data**: Frame kamera hanya diunggah ke server sebagai file JPEG bukti **jika dan hanya jika** terjadi anomali/pelanggaran yang terkonfirmasi.
3. **Kompatibilitas Fleksibel**: Model dimuat sebagai modul ECMAScript (ESM) modern langsung di browser tanpa mengharuskan instalasi dependensi binary C++/Python tambahan di sisi server.

### Alur Pemrosesan Frame (Tiap 3 Detik):
1. **Tangkapan Frame (Capture)**:
   Frame diambil dari video webcam peserta menggunakan batasan ideal 640x480 piksel (`facingMode: 'user'`).
2. **Prapemrosesan (Preprocessing)**:
   Frame diskalakan secara proporsional ke ukuran maksimal 640px pada canvas internal, kemudian diaplikasikan filter visual:
   $$\text{filter} = \text{contrast}(1.1) \times \text{brightness}(1.05)$$
   Hal ini mempertajam kontur wajah peserta di ruangan dengan pencahayaan minim.
3. **Inferensi Model (Inference)**:
   Model BlazeFace mengekstraksi titik koordinat wajah (`estimateFaces`) dengan ambang batas keyakinan minimal $\ge 0.5$.
4. **Pascapemrosesan (Post-processing)**:
   - **Filter Ukuran Minimum**: Wajah dengan dimensi $< 45\text{px}$ diabaikan untuk mencegah noise atau objek kecil di latar belakang terdeteksi sebagai wajah.
   - **Non-Maximum Suppression (NMS)**: Mengeliminasi kotak deteksi yang saling tumpang tindih dengan ambang batas $\text{IoU} \le 0.35$.
5. **Klasifikasi Status**:
   - Jumlah wajah $= 1 \longrightarrow \mathbf{Normal}$
   - Jumlah wajah $= 0 \longrightarrow \mathbf{No\ Face}$
   - Jumlah wajah $> 1 \longrightarrow \mathbf{Multiple\ Faces}$
6. **Gerbang Toleransi Anomali (Anomaly Gate)**:
   - **Consecutive Anomalies ($N=2$)**: Peringatan hanya dipicu jika status anomali yang sama muncul **dua siklus berturut-turut** (mencegah *false alarm* saat peserta berkedip atau menoleh sekejap).
   - **Anomaly Cooldown ($25\text{ detik}$)**: Pengiriman screenshot bukti ke server dibatasi dengan jeda waktu per jenis pelanggaran, mencegah database dipenuhi ribuan log dari insiden yang sama.
7. **Deteksi Pindah Tab (Looking Away)**:
   Memanfaatkan event `visibilitychange`. Jika peserta meninggalkan tab ujian selama lebih dari $1.5\text{ detik}$, status `Looking Away` langsung dicatat dan screenshot saat kembali dikirim ke server.

---

## 3. Rincian Implementasi pada `CAT_UTBK_V1`

### A. Frontend (`frontend/src/`)

1. **`src/ai/config.js`**
   - Mendefinisikan konstanta status (`Normal`, `No Face`, `Multiple Faces`, `Looking Away`).
   - Menyimpan parameter deteksi (interval 3000 ms, threshold 0.5, IoU 0.35, min face 45px, cooldown 25s, URL CDN ESM).
2. **`src/ai/detector.js`**
   - Memuat model BlazeFace dan TensorFlow.js melalui dynamic ESM import secara aman.
   - Menyediakan fungsi inisialisasi `createDetector()` dengan fallback ke `window.FaceDetector` jika tersedia.
3. **`src/ai/engine.js`**
   - Berisi fungsi `renderPreprocessedFrame`, `intersectionOverUnion`, `postprocessDetections`, `statusFromFaceCount`, dan kelas `AnomalyGate`.
4. **`src/ai/index.js`**
   - Entry point modul AI.
5. **`src/hooks/useProctoring.js`**
   - Menggantikan kode prototipe lama dengan alur kerja BlazeFace yang utuh.
   - Mengelola lifecycle kamera, loop sampling 3 detik, trigger notifikasi UI, dan pengiriman bukti multipart via `Api.kirimLog`.
6. **`src/pages/peserta/Ujian.jsx`**
   - Menampilkan status deteksi secara live pada panel kamera.
   - Menampilkan modal peringatan berbunyi *"Harap fokus ke layar!"* saat anomali terkonfirmasi.
   - Menampilkan label mode aktif (`blazeface`).

### B. Backend (`backend/app/Http/Controllers/`)

1. **`ProctoringController.php` (`insertLog`)**
   - Ditambahkan normalisasi otomatis parameter agar kompatibel dengan kontrak modul AI:
     - Jika payload mengirim `status`, otomatis dipetakan ke kolom `jenis_pelanggaran`.
     - Jika file screenshot dikirim dengan key `screenshot`, otomatis dipetakan ke `bukti_screenshot`.
     - Jika `id_rekam_jejak` tidak disertakan namun terdapat `id_ujian` dan `id_user`, controller secara otomatis mencari rekam jejak aktif peserta tersebut.
     - Jika status bernilai `Normal`, request direspons sukses tanpa mengotori tabel pelanggaran.
   - File tangkapan layar disimpan secara terstruktur di `storage/app/public/proctoring` dengan penamaan unik berbasis ID peserta dan timestamp.
2. **`AdminDashboardController.php` & `LogProctoring.php`**
   - Menyediakan data rekap pelanggaran untuk halaman admin, lengkap dengan URL screenshot yang dapat dibuka melalui modal verifikasi admin.

### C. Basis Data (`cat_system.sql`)

Tabel `log_proctoring` menyimpan hasil proctoring dengan struktur:
```sql
CREATE TABLE `log_proctoring` (
  `id_log` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_rekam_jejak` bigint UNSIGNED NOT NULL,
  `id_user` bigint UNSIGNED NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `jenis_pelanggaran` enum('Normal','No Face','Multiple Faces','Looking Away','Suspicious Activity') NOT NULL,
  `bukti_screenshot` varchar(500) DEFAULT NULL,
  `keterangan` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_log`)
);
```

---

## 4. Pengujian & Verifikasi Alur

Untuk menguji berjalannya modul AI yang baru diintegrasikan:

1. **Jalankan Backend**:
   ```bash
   cd backend
   php artisan serve --port=8000
   ```
2. **Jalankan Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
3. **Login sebagai Peserta** (`peserta_001` / `demo123`) di `http://localhost:5173`.
4. **Mulai Ujian**:
   - Berikan izin akses kamera saat peramban meminta izin.
   - Perhatikan panel kamera di pojok kanan bawah: badge akan bertuliskan `Wajah terdeteksi` dengan indikator mode `blazeface`.
   - **Uji Kasus 1 (`No Face`)**: Tutup kamera atau menunduk selama $\ge 6$ detik (2 siklus sampling). Modal peringatan *"Harap fokus ke layar! Wajah peserta tidak terdeteksi oleh kamera."* akan muncul dan log terkirim ke backend.
   - **Uji Kasus 2 (`Multiple Faces`)**: Mintalah rekan berada di dalam frame kamera bersamaan. Sistem akan menampilkan peringatan dan mengirimkan screenshot bukti.
   - **Uji Kasus 3 (`Looking Away`)**: Pindah tab peramban selama $\ge 2$ detik lalu kembali ke tab ujian. Peringatan perpindahan tab akan langsung terpicu.
5. **Verifikasi Admin**:
   - Login sebagai `admin` / `demo123`.
   - Buka menu **Laporan Proctoring** (`/admin/laporan`).
   - Seluruh bukti pelanggaran yang ditangkap oleh model AI BlazeFace beserta tangkapan gambarnya dapat ditinjau dan diekspor ke format CSV.

