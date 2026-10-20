import { useCallback, useEffect, useRef, useState } from 'react'
import Api from '../lib/api'

const INTERVAL = 3000
const WIDTH = 640
const QUALITY = 0.72
const CONF = 0.45
const COOLDOWN = 12000

/**
 * Kamera + deteksi wajah (face-api.js tiny_face_detector, offline dari /vendor)
 * Kirim log pelanggaran ke Laravel: POST /api/proctoring/log (multipart).
 */
export default function useProctoring({ aktif, idRekam, idUser, onViolation }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const timerRef = useRef(null)
  const busyRef = useRef(false)
  const lastSentRef = useRef({})
  const streamRef = useRef(null)
  const modeRef = useRef('none')

  const [status, setStatus] = useState('Normal')
  const [faces, setFaces] = useState(null)
  const [camOk, setCamOk] = useState(false)
  const [camError, setCamError] = useState('')
  const [mode, setMode] = useState('none')
  const [stats, setStats] = useState({ tick: 0, violations: 0 })

  const libRef = useRef(null)

  const loadLib = useCallback(async () => {
    if (window.faceapi) return 'faceapi'
    if (!libRef.current) {
      libRef.current = new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = '/vendor/face-api.min.js'
        s.onload = resolve
        s.onerror = () => reject(new Error('gagal memuat face-api'))
        document.head.appendChild(s)
      })
    }
    await libRef.current
    await window.faceapi.nets.tinyFaceDetector.loadFromUri('/vendor/weights')
    return 'faceapi'
  }, [])

  const frameBlob = useCallback(async () => {
    const v = videoRef.current
    const c = canvasRef.current
    if (!v?.videoWidth || !c) return null
    const w = WIDTH
    const h = Math.round(w * (v.videoHeight / v.videoWidth))
    c.width = w
    c.height = h
    c.getContext('2d').drawImage(v, 0, 0, w, h)
    return new Promise((res) => c.toBlob(res, 'image/jpeg', QUALITY))
  }, [])

  const kirim = useCallback(
    async (jenis, keterangan, force = false) => {
      const now = Date.now()
      const gap = force ? 2000 : COOLDOWN
      if (!force && lastSentRef.current[jenis] && now - lastSentRef.current[jenis] < gap) return
      lastSentRef.current[jenis] = now

      setStats((s) => ({ ...s, violations: s.violations + 1 }))
      onViolation?.({ jenis, keterangan, waktu: new Date() })

      if (!idRekam || !idUser) return
      try {
        const blob = await frameBlob()
        const fd = new FormData()
        fd.append('id_rekam_jejak', String(idRekam))
        fd.append('id_user', String(idUser))
        fd.append('jenis_pelanggaran', jenis)
        fd.append('keterangan', keterangan)
        if (blob) fd.append('bukti_screenshot', blob, 'frame.jpg')
        await Api.kirimLog(fd)
      } catch (e) {
        console.warn('Gagal kirim log proctoring:', e?.message)
      }
    },
    [idRekam, idUser, onViolation, frameBlob]
  )

  const deteksi = useCallback(async () => {
    const v = videoRef.current
    if (!v?.videoWidth) return -1
    if (modeRef.current === 'faceapi' && window.faceapi) {
      const opt = new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: CONF })
      const dets = await window.faceapi.detectAllFaces(v, opt)
      const minW = v.videoWidth * 0.11
      return dets.filter((d) => d.box.width >= minW).length
    }
    if (modeRef.current === 'native' && 'FaceDetector' in window) {
      try {
        const fd = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 })
        return (await fd.detect(v)).length
      } catch {
        return -1
      }
    }
    return -1
  }, [])

  const tick = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    try {
      const n = await deteksi()
      setFaces(n)
      setStats((s) => ({ ...s, tick: s.tick + 1 }))

      if (n < 0) {
        setStatus('Normal')
      } else if (n === 0) {
        setStatus('No Face')
        kirim('No Face', 'Wajah tidak terdeteksi pada frame kamera')
      } else if (n > 1) {
        setStatus('Multiple Faces')
        kirim('Multiple Faces', `Terdeteksi ${n} wajah dalam satu frame`)
      } else {
        setStatus('Normal')
      }
    } catch (e) {
      console.warn('tick error', e)
    } finally {
      busyRef.current = false
    }
  }, [deteksi, kirim])

  useEffect(() => {
    if (!aktif) return
    let cancelled = false

    const mulai = async () => {
      const v = videoRef.current
      if (!v) return
      v.muted = true
      v.playsInline = true
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        v.srcObject = stream
        await v.play().catch(() => {})
        setCamOk(true)
        setCamError('')
      } catch (e) {
        setCamOk(false)
        setCamError(e?.name === 'NotAllowedError' ? 'Izin kamera ditolak.' : 'Kamera tidak tersedia.')
        return
      }

      try {
        modeRef.current = await loadLib()
      } catch {
        modeRef.current = 'FaceDetector' in window ? 'native' : 'none'
      }
      setMode(modeRef.current)

      timerRef.current = setInterval(tick, INTERVAL)
      setTimeout(tick, 800)
    }

    const onVis = () => {
      if (document.hidden) {
        document.body.dataset.awayFlag = '1'
      } else if (document.body.dataset.awayFlag === '1') {
        delete document.body.dataset.awayFlag
        kirim('Looking Away', 'Peserta berpindah tab atau meninggalkan halaman ujian', true)
      }
    }

    document.addEventListener('visibilitychange', onVis)
    mulai()

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVis)
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif])

  return { videoRef, canvasRef, status, faces, camOk, camError, mode, stats, simulasi: kirim }
}
