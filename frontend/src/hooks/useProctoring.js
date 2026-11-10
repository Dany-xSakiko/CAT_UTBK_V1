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
 * Hook Proctoring Otomatis Berbasis AI (BlazeFace + TensorFlow.js / Fallback Lokal)
 * Kamera dan model AI diinisialisasi secara paralel agar deteksi pertama langsung aktif.
 */
export default function useProctoring({ aktif, idRekam, idUser, initialViolations = 0, onViolation }) {
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
  const [mode, setMode] = useState('loading')
  const [stats, setStats] = useState({ tick: 0, violations: Number(initialViolations) || 0 })

  // Sinkronkan jumlah pelanggaran awal dari database saat sesi dimuat
  useEffect(() => {
    const n = Number(initialViolations) || 0
    setStats((s) => (n > s.violations ? { ...s, violations: n } : s))
  }, [initialViolations])

  const getFrameBlob = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || canvas.width === 0 || canvas.height === 0) return Promise.resolve(null)
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', DEFAULT_CONFIG.screenshotJpegQuality)
    })
  }, [])

  const kirimLog = useCallback(
    async (jenis, keterangan, customBlob = null) => {
      // Update counter di UI secara instan begitu pelanggaran terpicu
      if (jenis && jenis !== STATUS.NORMAL) {
        setStats((s) => ({ ...s, violations: s.violations + 1 }))
      }
      if (!idRekam) return

      try {
        const blob = customBlob || (await getFrameBlob())
        const fd = new FormData()
        fd.append('id_rekam_jejak', String(idRekam))
        if (idUser) fd.append('id_user', String(idUser))
        fd.append('jenis_pelanggaran', jenis)
        fd.append('keterangan', keterangan || `Terdeteksi anomali: ${jenis}`)
        if (blob) {
          fd.append('bukti_screenshot', blob, 'bukti_pelanggaran.jpg')
        }

        await Api.kirimLog(fd)
      } catch (err) {
        console.warn('[AI Proctoring] Gagal mengirim log ke backend:', err?.message || err)
      }
    },
    [idRekam, idUser, getFrameBlob]
  )

  const analyzeCycle = useCallback(async () => {
    if (busyRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const detector = detectorRef.current
    if (!video || !canvas || !detector || !video.videoWidth) return

    busyRef.current = true
    try {
      const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false })
      if (!ctx) return

      const { width, height } = renderPreprocessedFrame(video, canvas, ctx, DEFAULT_CONFIG)
      const rawDetections = await detector.detect(canvas)
      const filteredDetections = postprocessDetections(rawDetections, width, height, DEFAULT_CONFIG)
      const faceCount = filteredDetections.length
      setFaces(faceCount)
      setStats((s) => ({ ...s, tick: s.tick + 1 }))

      const currentStatus = statusFromFaceCount(faceCount)
      setStatus(currentStatus)

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

  useEffect(() => {
    if (!aktif) return

    let isSubscribed = true
    gateRef.current.reset()

    const initCamera = async () => {
      const video = videoRef.current
      if (!video) return false

      video.muted = true
      video.playsInline = true

      try {
        const stream = await navigator.mediaDevices.getUserMedia(DEFAULT_CONFIG.cameraConstraints)
        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop())
          return false
        }

        streamRef.current = stream
        video.srcObject = stream
        await video.play().catch(() => {})

        const track = stream.getVideoTracks()[0]
        if (track) {
          track.onended = () => {
            setCamOk(false)
            const msg = 'Kamera terputus atau dinonaktifkan saat ujian berlangsung.'
            setCamError(msg)
            kirimLog(STATUS.SUSPICIOUS, msg)
          }
        }

        setCamOk(true)
        setCamError('')
        return true
      } catch (err) {
        if (!isSubscribed) return false
        setCamOk(false)
        const msg =
          err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
            ? 'Izin kamera ditolak oleh peserta.'
            : 'Kamera tidak ditemukan atau sedang digunakan aplikasi lain.'
        setCamError(msg)
        kirimLog(STATUS.SUSPICIOUS, msg)
        return false
      }
    }

    const initDetector = async () => {
      try {
        const detector = await createDetector(DEFAULT_CONFIG)
        if (!isSubscribed) return false
        detectorRef.current = detector
        setMode(detector.type || 'blazeface')
        return true
      } catch (err) {
        console.error('[AI Proctoring] Gagal menginisialisasi detector AI:', err)
        if (isSubscribed) {
          setMode('failed')
          kirimLog(STATUS.SUSPICIOUS, 'Modul deteksi wajah gagal dimuat di browser peserta.')
        }
        return false
      }
    }

    const startProctoring = async () => {
      const [camReady, aiReady] = await Promise.all([initCamera(), initDetector()])
      if (!isSubscribed || !camReady || !aiReady) return

      const video = videoRef.current
      if (video && video.videoWidth > 0) {
        analyzeCycle()
      } else if (video) {
        video.addEventListener('loadeddata', () => isSubscribed && analyzeCycle(), { once: true })
      }

      timerRef.current = setInterval(() => {
        analyzeCycle()
      }, DEFAULT_CONFIG.intervalMs)
    }

    const handleVisibility = async () => {
      if (document.hidden) {
        lastTabSwitchRef.current = Date.now()
      } else if (lastTabSwitchRef.current > 0) {
        const now = Date.now()
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
      detectorRef.current = null
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
