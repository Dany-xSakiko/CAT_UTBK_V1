import { DEFAULT_CONFIG } from './config'

/**
 * Helper untuk memuat dynamic ESM di browser secara aman tanpa intervensi static bundler Vite.
 */
async function importEsm(url) {
  try {
    const dynamicImport = new Function('modulePath', 'return import(modulePath)')
    return await dynamicImport(url)
  } catch (err) {
    console.warn(`[AI Engine] Gagal memuat modul dari ${url}:`, err?.message || err)
    throw err
  }
}

/**
 * Inisialisasi Model AI BlazeFace berbasis CNN TensorFlow.js.
 */
export async function createBlazeFaceDetector(config = DEFAULT_CONFIG) {
  const [tf, blazeface] = await Promise.all([
    importEsm(config.tfjsUrl),
    importEsm(config.blazefaceUrl),
  ])

  if (tf && typeof tf.ready === 'function') {
    await tf.ready()
  }

  const model = await blazeface.load({
    maxFaces: config.maxFaces,
    scoreThreshold: config.minConfidence,
    iouThreshold: config.nmsIouThreshold,
  })

  return {
    type: 'blazeface',
    async detect(source) {
      // estimateFaces(source, returnTensors = false, flipHorizontal = false)
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
    },
    dispose() {
      if (typeof model?.dispose === 'function') {
        model.dispose()
      }
    },
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
 * Factory detector yang memprioritaskan BlazeFace (CNN TensorFlow.js)
 * dengan fallback native FaceDetector jika ada kendala koneksi CDN.
 */
export async function createDetector(config = DEFAULT_CONFIG) {
  try {
    return await createBlazeFaceDetector(config)
  } catch (err) {
    console.warn('[AI Engine] BlazeFace CDN gagal dimuat, mencoba fallback native…', err)
    const native = createNativeDetector()
    if (native) return native
    throw new Error('Modul AI deteksi wajah gagal diinisialisasi (pastikan browser terhubung ke internet).')
  }
}

