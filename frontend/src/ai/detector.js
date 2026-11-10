import { DEFAULT_CONFIG } from './config'

// Cache singleton agar model AI hanya diunduh & dikompilasi sekali selama aplikasi berjalan
let cachedDetectorPromise = null

async function importEsm(url, timeoutMs = 4500) {
  const dynamicImport = new Function('modulePath', 'return import(modulePath)')
  if (!timeoutMs) return dynamicImport(url)

  return Promise.race([
    dynamicImport(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout memuat modul AI dari ${url}`)), timeoutMs)
    ),
  ])
}

/**
 * Warmup 1x dengan kanvas 128x128 agar shader WebGL dikompilasi saat inisialisasi,
 * bukan saat frame pertama kamera masuk.
 */
async function warmupModel(detectFn) {
  try {
    if (typeof document === 'undefined') return
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 128
    await detectFn(c)
  } catch {
    /* abaikan error warmup */
  }
}

/**
 * Inisialisasi Model AI BlazeFace berbasis CNN TensorFlow.js (diakselerasi WebGL).
 */
export async function createBlazeFaceDetector(config = DEFAULT_CONFIG) {
  const [tf, blazeface] = await Promise.all([
    importEsm(config.tfjsUrl, config.cdnTimeoutMs),
    importEsm(config.blazefaceUrl, config.cdnTimeoutMs),
  ])

  if (tf) {
    try {
      if (typeof tf.setBackend === 'function' && tf.getBackend?.() !== 'webgl') {
        await tf.setBackend('webgl').catch(() => {})
      }
      if (typeof tf.ready === 'function') {
        await tf.ready()
      }
    } catch {
      /* lanjut dengan backend default */
    }
  }

  const model = await blazeface.load({
    maxFaces: config.maxFaces,
    scoreThreshold: config.minConfidence,
    iouThreshold: config.nmsIouThreshold,
  })

  const detect = async (source) => {
    const predictions = await model.estimateFaces(source, false, false)
    return predictions.map((prediction) => {
      const [left, top] = Array.from(prediction.topLeft)
      const [right, bottom] = Array.from(prediction.bottomRight)
      const confidence = Array.from(prediction.probability || [1.0])[0]
      return {
        box: [left, top, Math.max(0, right - left), Math.max(0, bottom - top)],
        confidence,
      }
    })
  }

  await warmupModel(detect)

  return {
    type: 'blazeface',
    detect,
    dispose() {
      // sengaja tidak dispose model singleton agar perpindahan halaman tetap instan
    },
  }
}

/**
 * Fallback lokal menggunakan face-api.min.js + tiny_face_detector dari /vendor (tanpa internet).
 */
export async function createLocalTinyFaceDetector(config = DEFAULT_CONFIG) {
  if (typeof window === 'undefined') return null

  if (!window.faceapi) {
    await new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${config.localFaceApiScript}"]`)
      if (existing && window.faceapi) return resolve()
      const s = document.createElement('script')
      s.src = config.localFaceApiScript
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Gagal memuat face-api lokal'))
      document.head.appendChild(s)
    })
  }

  const faceapi = window.faceapi
  if (!faceapi?.nets?.tinyFaceDetector) return null

  if (!faceapi.nets.tinyFaceDetector.isLoaded) {
    await faceapi.nets.tinyFaceDetector.loadFromUri(config.localWeightsPath)
  }

  const opts = new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: config.minConfidence,
  })

  const detect = async (source) => {
    const results = await faceapi.detectAllFaces(source, opts)
    return results.map((r) => ({
      box: [r.box.x, r.box.y, r.box.width, r.box.height],
      confidence: r.score ?? 1.0,
    }))
  }

  await warmupModel(detect)

  return {
    type: 'tinyface-local',
    detect,
    dispose() {},
  }
}

/**
 * Fallback detector menggunakan Shape Detection API (jika didukung browser).
 */
export function createNativeDetector() {
  if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    const fd = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 })
    return {
      type: 'native',
      async detect(source) {
        const faces = await fd.detect(source)
        return faces.map((f) => ({
          box: [f.boundingBox.x, f.boundingBox.y, f.boundingBox.width, f.boundingBox.height],
          confidence: 1.0,
        }))
      },
      dispose() {},
    }
  }
  return null
}

/**
 * Factory detector dengan singleton caching:
 * 1. BlazeFace (WebGL) -> 2. TinyFace lokal (/vendor) -> 3. Native FaceDetector.
 */
export async function createDetector(config = DEFAULT_CONFIG) {
  if (!cachedDetectorPromise) {
    cachedDetectorPromise = (async () => {
      try {
        return await createBlazeFaceDetector(config)
      } catch (err) {
        console.warn('[AI Engine] BlazeFace CDN lambat/gagal, beralih ke model lokal…', err?.message || err)
      }

      try {
        const local = await createLocalTinyFaceDetector(config)
        if (local) return local
      } catch (err) {
        console.warn('[AI Engine] Model lokal gagal dimuat:', err?.message || err)
      }

      const native = createNativeDetector()
      if (native) return native

      cachedDetectorPromise = null
      throw new Error('Modul AI deteksi wajah gagal diinisialisasi.')
    })()
  }

  return cachedDetectorPromise
}

/**
 * Preload model AI di belakang layar (misal saat halaman dashboard peserta dibuka)
 * agar begitu peserta klik "Mulai ujian", detektor langsung siap 0 ms.
 */
export function preloadDetector(config = DEFAULT_CONFIG) {
  createDetector(config).catch(() => {})
}
