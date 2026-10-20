/* ============================================================
   Konfigurasi global — CAT UTBK
   Ubah DEMO_MODE ke false setelah backend Laravel siap.
   ============================================================ */
window.CAT_CONFIG = {
  APP_NAME: 'CAT UTBK',
  APP_SUB: 'Computer Assisted Test',
  INSTANSI: 'Universitas Nusantara PGRI Kediri',
  PRODI: 'Teknik Informatika',
  KELOMPOK: 'Kelompok 2 · Kelas 4D',

  /* true  = jalan tanpa backend, data di localStorage
     false = semua request ke API_BASE (Laravel) */
  DEMO_MODE: true,
  API_BASE: '/api',
  CSRF_HEADER: 'X-CSRF-TOKEN',

  /* Proctoring */
  PROCTOR_INTERVAL_MS: 3000,     // kirim frame tiap 3 detik
  PROCTOR_CAPTURE_WIDTH: 640,    // lebar frame yang dikirim
  PROCTOR_JPEG_QUALITY: 0.72,
  FACE_MIN_CONFIDENCE: 0.45,     // ambang tiny_face_detector
  WARN_COOLDOWN_MS: 12000,       // jeda minimal antar peringatan
  MAX_WARNING_BEFORE_DQ: 12,     // akumulasi peringatan sebelum diskualifikasi

  /* Penyimpanan lokal (mode demo) */
  STORAGE: {
    DB: 'cat_utbk_db_v1',
    SESSION: 'cat_utbk_session_v1'
  },

  /* Halaman */
  ROUTES: {
    login: '../login.html',
    pesertaHome: 'dashboard.html',
    ujian: 'ujian.html',
    hasil: 'hasil.html',
    adminHome: '../admin/dashboard.html'
  }
};
