/**
 * Konfigurasi Modul AI Computer Vision (BlazeFace + TensorFlow.js)
 * Dioptimalkan untuk latensi rendah dan inferensi real-time di browser.
 */

export const STATUS = Object.freeze({
  NORMAL: 'Normal',
  NO_FACE: 'No Face',
  MULTIPLE_FACES: 'Multiple Faces',
  LOOKING_AWAY: 'Looking Away',
  SUSPICIOUS: 'Suspicious Activity',
})

export const DEFAULT_CONFIG = Object.freeze({
  // Waktu sampling kamera (1.2 detik agar responsif terhadap pergerakan wajah)
  intervalMs: 1200,

  // Resolusi frame kerja AI (BlazeFace internal = 128x128; 320px 4x lebih cepat dari 640px tanpa mengurangi akurasi)
  maxFrameDimension: 320,

  // Ambang batas kepercayaan deteksi wajah
  minConfidence: 0.5,

  // Ukuran minimum kotak wajah dalam piksel (proporsional terhadap 320px)
  minFaceSizePx: 24,

  // Ambang batas IoU untuk Non-Maximum Suppression (NMS)
  nmsIouThreshold: 0.35,

  // Jumlah maksimal wajah yang dipindai
  maxFaces: 5,

  // Batas waktu tunggu CDN sebelum beralih ke model lokal (ms)
  cdnTimeoutMs: 4500,

  // CDN ESM untuk TensorFlow.js dan BlazeFace
  tfjsUrl: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/+esm',
  blazefaceUrl: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.1.0/+esm',

  // Fallback aset model lokal (bebas internet, sudah tersedia di public/vendor)
  localFaceApiScript: '/vendor/face-api.min.js',
  localWeightsPath: '/vendor/weights',

  // Toleransi anomali: 2 kali sampling berturut-turut (~2.4 detik) sebelum trigger peringatan
  consecutiveAnomalies: 2,

  // Cooldown pencatatan ke database untuk pelanggaran yang sama (dalam ms: 25 detik)
  anomalyCooldownMs: 25000,

  // Kualitas kompresi screenshot JPEG bukti pelanggaran (0.0 - 1.0)
  screenshotJpegQuality: 0.78,

  // Prapemrosesan gambar (1 = tanpa filter CSS tambahan agar GPU canvas tetap cepat)
  contrast: 1,
  brightness: 1,

  // Batasan stream webcam (resolusi ringan agar start kamera cepat)
  cameraConstraints: Object.freeze({
    audio: false,
    video: Object.freeze({
      facingMode: 'user',
      width: Object.freeze({ ideal: 480 }),
      height: Object.freeze({ ideal: 360 }),
      frameRate: Object.freeze({ ideal: 15, max: 24 }),
    }),
  }),
})
