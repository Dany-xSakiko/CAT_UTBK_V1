import { useCallback, useEffect, useRef, useState } from 'react'
import Api from '../lib/api'
import { DEFAULT_CONFIG, STATUS } from '../ai/config'
import { createDetector } from '../ai/detector'
import {
  AnomalyGate,
  postprocessDetections,
  renderPreprocessedFrame,
  statusFromFaceCount,
} from '../ai/engine'

/**
 * Hook Proctoring Otomatis Berbasis AI (BlazeFace + TensorFlow.js)
 * Mengawasi kehadiran peserta, mendeteksi wajah tunggal/banyak, serta perpindahan tab.
 *
 * @param {Object} params
 * @param {boolean} params.aktif - Apakah proctoring sedang berjalan
 * @param {number|string} params.idRekam - ID rekam jejak sesi ujian
 * @param {number|string} params.idUser - ID peserta ujian
 * @param {Function} [params.onViolation] - Callback saat peringatan terpicu di antarmuka
 */
export default function useProctoring({ aktif, idRekam, idUser, onViolation }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const gateRef = useRef(new AnomalyGate(DEFAULT_CONFIG))
  const timerRef = useRef(null)
  const busyRef = useRef(false)
  const lastTabSwitchRef = useRef(0)

  const [status, setStatus] = useState(STATUS.NORMAL)
  const [faces, setFaces] = useState(null)
  const [camOk, setCamOk] = useState(false)
  const [camError, setCamError] = useState('')
  const [mode, setMode] = useState('none')
  const [stats, setStats] = useState({ tick: 0, violations: 0 })

  /**
   * Menghasilkan Blob JPEG dari kanvas frame saat ini sebagai bukti pelanggaran.
   */
  const getFrameBlob = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || canvas.width === 0 || canvas.height === 0) return Promise.resolve(null)
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', DEFAULT_CONFIG.screenshotJpegQuality)
    })
  }, [])

  /**
   * Mengirim log pelanggaran ke API Backend Laravel: POST /api/proctoring/log (multipart/form-data)
   */
  const kirimLog = useCallback(
    async (jenis, keterangan, customBlob = null) => {
      if (!idRekam || !idUser) return

      try {
        const blob = customBlob || (await getFrameBlob())
        const fd = new FormData()
        fd.append('id_rekam_jejak', String(idRekam))
        fd.append('id_user', String(idUser))
        fd.append('jenis_pelanggaran', jenis)
        fd.append('keterangan', keterangan || `Terdeteksi anomali: ${jenis}`)
        if (blob) {
          fd.append('bukti_screenshot', blob, 'bukti_pelanggaran.jpg')
        }

        await Api.kirimLog(fd)
        setStats((s) => ({ ...s, violations: s.violations + 1 }))
      } catch (err) {
        console.warn('[AI Proctoring] Gagal mengirim log ke backend:', err?.message || err)
      }
    },
    [idRekam, idUser, getFrameBlob]
  )

  /**
   * Siklus analisis kamera per interval (default: tiap 3000 ms)
   */
  const analyzeCycle = useCallback(async () => {
    if (busyRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const detector = detectorRef.current
    if (!video || !canvas || !detector || !video.videoWidth) return

    busyRef.current = true
    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: false })
      if (!ctx) return

      // 1. Prapemrosesan frame (kontras & kecerahan ditingkatkan)
      const { width, height } = renderPreprocessedFrame(video, canvas, ctx, DEFAULT_CONFIG)

      // 2. Deteksi wajah dengan model AI (BlazeFace)
      const rawDetections = await detector.detect(canvas)

      // 3. Pascapemrosesan (clipping, filter ukuran min, NMS IoU)
      const filteredDetections = postprocessDetections(rawDetections, width, height, DEFAULT_CONFIG)
      const faceCount = filteredDetections.length
      setFaces(faceCount)
      setStats((s) => ({ ...s, tick: s.tick + 1 }))

      // 4. Klasifikasi status (Normal, No Face, Multiple Faces)
      const currentStatus = statusFromFaceCount(faceCount)
      setStatus(currentStatus)

      // 5. Evaluasi gerbang toleransi anomali (Anomaly Gate)
      const decision = gateRef.current.evaluate(currentStatus, Date.now())

      if (decision.warn) {
        const info =
          currentStatus === STATUS.NO_FACE
            ? 'Harap fokus ke layar! Wajah peserta tidak terdeteksi oleh kamera.'
            : 'Harap fokus ke layar! Terdeteksi lebih dari satu orang di depan kamera.'

        onViolation?.({
          jenis: currentStatus,
          keterangan: info,
          waktu: new Date(),
        })
      }

      if (decision.logged) {
        const desc =
          currentStatus === STATUS.NO_FACE
            ? 'Wajah tidak terdeteksi pada frame kamera'
            : `Terdeteksi ${faceCount} wajah dalam frame kamera`
        await kirimLog(currentStatus, desc)
      }
    } catch (err) {
      console.warn('[AI Proctoring] Error pada siklus analisis:', err)
    } finally {
      busyRef.current = false
    }
  }, [onViolation, kirimLog])

  /**
   * Lifecycle Kamera & Model AI
   */
  useEffect(() => {
    if (!aktif) return

    let isSubscribed = true
    gateRef.current.reset()

    const startProctoring = async () => {
      const video = videoRef.current
      if (!video) return

      video.muted = true
      video.playsInline = true

      // 1. Dapatkan akses kamera
      try {
        const stream = await navigator.mediaDevices.getUserMedia(DEFAULT_CONFIG.cameraConstraints)
        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        video.srcObject = stream
        await video.play().catch(() => {})

        const track = stream.getVideoTracks()[0]
        if (track) {
          track.onended = () => {
            setCamOk(false)
            setCamError('Kamera terputus atau dinonaktifkan oleh sistem.')
          }
        }

        setCamOk(true)
        setCamError('')
      } catch (err) {
        if (!isSubscribed) return
        setCamOk(false)
        const msg =
          err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
            ? 'Izin kamera ditolak. Harap izinkan akses kamera di browser Anda.'
            : 'Kamera tidak ditemukan atau sedang digunakan aplikasi lain.'
        setCamError(msg)
        return
      }

      // 2. Muat model AI BlazeFace
      try {
        const detector = await createDetector(DEFAULT_CONFIG)
        if (!isSubscribed) {
          detector?.dispose?.()
          return
        }
        detectorRef.current = detector
        setMode(detector.type || 'blazeface')
      } catch (err) {
        console.error('[AI Proctoring] Gagal menginisialisasi detector AI:', err)
        setMode('failed')
      }

      // 3. Jalankan interval sampling 3 detik
      timerRef.current = setInterval(() => {
        analyzeCycle()
      }, DEFAULT_CONFIG.intervalMs)

      // Jalankan sekali di awal setelah pemanasan kamera
      setTimeout(() => {
        if (isSubscribed) analyzeCycle()
      }, 1000)
    }

    // 4. Deteksi perpindahan tab browser (Looking Away)
    const handleVisibility = async () => {
      if (document.hidden) {
        lastTabSwitchRef.current = Date.now()
      } else if (lastTabSwitchRef.current > 0) {
        const now = Date.now()
        // Pemicu jika peserta meninggalkan tab lebih dari 1.5 detik
        if (now - lastTabSwitchRef.current >= 1500) {
          const jenis = STATUS.LOOKING_AWAY
          const info = 'Harap tetap berada di tab ujian! Peserta terdeteksi berpindah tab atau aplikasi.'

          onViolation?.({
            jenis,
            keterangan: info,
            waktu: new Date(),
          })

          await kirimLog(jenis, 'Peserta berpindah tab atau meninggalkan jendela browser saat ujian aktif.')
        }
        lastTabSwitchRef.current = 0
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    startProctoring()

    return () => {
      isSubscribed = false
      document.removeEventListener('visibilitychange', handleVisibility)
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (detectorRef.current?.dispose) {
        detectorRef.current.dispose()
        detectorRef.current = null
      }
    }
  }, [aktif, analyzeCycle, onViolation, kirimLog])

  return {
    videoRef,
    canvasRef,
    status,
    faces,
    camOk,
    camError,
    mode,
    stats,
    simulasi: kirimLog,
  }
}
