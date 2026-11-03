/**
 * Konfigurasi Modul AI Computer Vision (BlazeFace + TensorFlow.js)
 * Diadopsi dari modul cat_proctoring untuk CAT_UTBK_V1.
 */

export const STATUS = Object.freeze({
  NORMAL: 'Normal',
  NO_FACE: 'No Face',
  MULTIPLE_FACES: 'Multiple Faces',
  LOOKING_AWAY: 'Looking Away',
  SUSPICIOUS: 'Suspicious Activity',
})

export const DEFAULT_CONFIG = Object.freeze({
  // Waktu sampling kamera (3 detik sesuai spesifikasi proyek)
  intervalMs: 3000,

  // Resolusi maksimal frame sebelum diproses AI (efisiensi beban komputasi)
  maxFrameDimension: 640,

  // Ambang batas kepercayaan deteksi wajah
  minConfidence: 0.5,

  // Ukuran minimum kotak wajah dalam piksel (menghindari noise/deteksi palsu objek kecil di background)
  minFaceSizePx: 45,

  // Ambang batas IoU untuk Non-Maximum Suppression (NMS)
  nmsIouThreshold: 0.35,

  // Jumlah maksimal wajah yang dipindai
  maxFaces: 10,

  // CDN ESM untuk TensorFlow.js dan BlazeFace (berjalan di browser tanpa dependensi binary lokal)
  tfjsUrl: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/+esm',
  blazefaceUrl: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.1.0/+esm',

  // Toleransi anomali: butuh 2 kali sampling berturut-turut sebelum trigger peringatan ke peserta
  consecutiveAnomalies: 2,

  // Cooldown pencatatan ke database untuk pelanggaran yang sama (dalam ms: 25 detik)
  anomalyCooldownMs: 25000,

  // Kualitas kompresi screenshot JPEG bukti pelanggaran (0.0 - 1.0)
  screenshotJpegQuality: 0.8,

  // Prapemrosesan gambar (penyesuaian kontras dan kecerahan frame webcam)
  contrast: 1.1,
  brightness: 1.05,

  // Batasan stream webcam
  cameraConstraints: Object.freeze({
    audio: false,
    video: Object.freeze({
      facingMode: 'user',
      width: Object.freeze({ ideal: 640 }),
      height: Object.freeze({ ideal: 480 }),
    }),
  }),
})

