import { DEFAULT_CONFIG, STATUS } from './config'

/**
 * Menghitung Intersection over Union (IoU) antara dua kotak pembatas [x, y, width, height].
 */
export function intersectionOverUnion(a, b) {
  const [ax, ay, aw, ah] = a
  const [bx, by, bw, bh] = b
  const interW = Math.max(0, Math.min(ax + aw, bx + bw) - Math.max(ax, bx))
  const interH = Math.max(0, Math.min(ay + ah, by + bh) - Math.max(ay, by))
  const interArea = interW * interH
  const unionArea = aw * ah + bw * bh - interArea
  return unionArea > 0 ? interArea / unionArea : 0
}

/**
 * Prapemrosesan frame dari elemen video ke elemen canvas:
 * Rescaling proporsional sesuai maxFrameDimension (320px) agar transfer piksel ke GPU cepat.
 */
export function renderPreprocessedFrame(source, canvas, context, config = DEFAULT_CONFIG) {
  const sourceWidth = source.videoWidth || source.naturalWidth || source.width
  const sourceHeight = source.videoHeight || source.naturalHeight || source.height
  if (!sourceWidth || !sourceHeight) {
    throw new Error('Ukuran frame video kamera belum siap.')
  }

  const scale = Math.min(1, config.maxFrameDimension / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  const useFilter = (config.contrast && config.contrast !== 1) || (config.brightness && config.brightness !== 1)
  if (useFilter) {
    context.filter = `contrast(${config.contrast}) brightness(${config.brightness})`
  }
  try {
    context.drawImage(source, 0, 0, width, height)
  } finally {
    if (useFilter) context.filter = 'none'
  }

  return { width, height, scaleX: sourceWidth / width, scaleY: sourceHeight / height }
}

/**
 * Pascapemrosesan hasil deteksi AI:
 * - Memotong koordinat agar berada dalam batas kanvas.
 * - Memfilter kotak yang lebih kecil dari minFaceSizePx (mengabaikan noise/objek latar belakang).
 * - Non-Maximum Suppression (NMS) untuk menghilangkan kotak deteksi ganda pada wajah yang sama.
 */
export function postprocessDetections(detections, width, height, config = DEFAULT_CONFIG) {
  if (!Array.isArray(detections)) return []

  const candidates = detections.flatMap((d) => {
    const box = d?.box
    const confidence = d?.confidence ?? 1.0
    if (!Array.isArray(box) || box.length !== 4 || confidence < config.minConfidence) {
      return []
    }

    const [rawX, rawY, rawW, rawH] = box
    const x = Math.max(0, rawX)
    const y = Math.max(0, rawY)
    const right = Math.min(width, rawX + rawW)
    const bottom = Math.min(height, rawY + rawH)
    const clippedW = right - x
    const clippedH = bottom - y

    if (clippedW < config.minFaceSizePx || clippedH < config.minFaceSizePx) {
      return []
    }

    return [{ box: [x, y, clippedW, clippedH], confidence }]
  })

  candidates.sort((a, b) => b.confidence - a.confidence)

  const kept = []
  for (const candidate of candidates) {
    if (kept.every((selected) => intersectionOverUnion(candidate.box, selected.box) <= config.nmsIouThreshold)) {
      kept.push(candidate)
    }
  }

  return kept
}

/**
 * Menentukan status proctoring berdasarkan jumlah wajah yang terdeteksi.
 */
export function statusFromFaceCount(count) {
  if (!Number.isInteger(count) || count < 0) return STATUS.NORMAL
  if (count === 0) return STATUS.NO_FACE
  if (count === 1) return STATUS.NORMAL
  return STATUS.MULTIPLE_FACES
}

/**
 * Gerbang toleransi anomali (Anomaly Gate):
 * - Setiap transisi ke status anomali baru (setelah Normal) langsung dihitung & dicatat.
 * - Jika peserta terus-menerus berada di anomali yang sama tanpa kembali Normal,
 *   pelanggaran berikutnya dicatat ulang setiap `anomalyCooldownMs`.
 */
export class AnomalyGate {
  constructor(config = DEFAULT_CONFIG) {
    this.config = config
    this.consecutiveCount = 0
    this.lastStatus = null
    this.lastLoggedAt = new Map()
    this.warnedStatus = null
  }

  evaluate(status, now = Date.now()) {
    if (status === STATUS.NORMAL) {
      this.consecutiveCount = 0
      this.lastStatus = null
      this.warnedStatus = null
      return { warn: false, logged: false }
    }

    if (this.lastStatus === status) {
      this.consecutiveCount += 1
    } else {
      this.lastStatus = status
      this.consecutiveCount = 1
      this.warnedStatus = null
    }

    if (this.consecutiveCount < this.config.consecutiveAnomalies) {
      return { warn: false, logged: false }
    }

    const isNewEpisode = this.warnedStatus !== status
    const lastLogged = this.lastLoggedAt.get(status) ?? Number.NEGATIVE_INFINITY
    const cooldownElapsed = now - lastLogged >= this.config.anomalyCooldownMs

    // Episode pelanggaran baru ATAU anomali berkepanjangan melewati cooldown -> hitung & catat
    if (isNewEpisode || cooldownElapsed) {
      this.warnedStatus = status
      this.lastLoggedAt.set(status, now)
      return { warn: true, logged: true }
    }

    return { warn: false, logged: false }
  }

  reset() {
    this.consecutiveCount = 0
    this.lastStatus = null
    this.warnedStatus = null
    this.lastLoggedAt.clear()
  }
}
