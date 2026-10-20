import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Icon from '../../lib/icons'
import Api, { pesanError } from '../../lib/api'
import { durasi, jamDetik } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui'
import useProctoring from '../../hooks/useProctoring'

const HURUF = ['A', 'B', 'C', 'D', 'E']

export default function PesertaUjian() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const nav = useNavigate()

  const [data, setData] = useState(null)
  const [idx, setIdx] = useState(0)
  const [jawab, setJawab] = useState({})
  const [flag, setFlag] = useState(() => new Set())
  const [sisa, setSisa] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('Jawaban tersimpan otomatis')
  const [modal, setModal] = useState(false)
  const [mengirim, setMengirim] = useState(false)
  const [warn, setWarn] = useState(null)
  const [warnCount, setWarnCount] = useState(0)
  const [camMin, setCamMin] = useState(false)
  const selesaiRef = useRef(false)

  const soal = data?.soal || []
  const aktif = data?.rekam?.status_pengerjaan === 'sedang_mengerjakan'

  /* ------------------------------------------------ muat sesi */
  useEffect(() => {
    let alive = true
    setLoading(true)
    Api.getRekam(id)
      .then((res) => {
        if (!alive) return
        const d = res.data
        if (d.rekam.status_pengerjaan !== 'sedang_mengerjakan') {
          nav(`/peserta/hasil/${id}`, { replace: true })
          return
        }
        setData(d)
        setJawab(d.jawaban || {})
        setSisa(Number(d.rekam.sisa_detik) || 0)
      })
      .catch((e) => alive && setErr(pesanError(e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id, nav])

  /* ------------------------------------------------ timer */
  useEffect(() => {
    if (!data) return
    if (sisa <= 0) return
    const t = setInterval(() => setSisa((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [data, sisa <= 0])

  const selesai = useCallback(
    async (otomatis = false) => {
      if (selesaiRef.current) return
      selesaiRef.current = true
      setMengirim(true)
      try {
        await Api.selesai(id)
        toast(otomatis ? 'Waktu habis — jawaban otomatis dikumpulkan.' : 'Jawaban dikirim.')
        nav(`/peserta/hasil/${id}`, { replace: true })
      } catch (e) {
        selesaiRef.current = false
        toast(pesanError(e), 'err')
      } finally {
        setMengirim(false)
      }
    },
    [id, nav, toast]
  )

  useEffect(() => {
    if (data && sisa === 0 && aktif) selesai(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sisa, data])

  useEffect(() => {
    if (!aktif) return
    const h = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [aktif])

  /* ------------------------------------------------ proctoring */
  const onViolation = useCallback((v) => {
    setWarn(v)
    setWarnCount((n) => n + 1)
    setTimeout(() => setWarn(null), 6000)
  }, [])

  const proctor = useProctoring({
    aktif: !!data && aktif,
    idRekam: data?.rekam?.id_rekam_jejak,
    idUser: user?.id_user,
    onViolation,
  })

  /* ------------------------------------------------ jawab */
  const pilih = async (kunci) => {
    const s = soal[idx]
    if (!s || !aktif) return
    setJawab((j) => ({ ...j, [s.id_soal]: kunci }))
    setNote('Menyimpan…')
    try {
      await Api.jawab(id, { id_soal: s.id_soal, jawaban: kunci })
      setNote('Jawaban tersimpan otomatis')
    } catch (e) {
      setNote('Gagal menyimpan')
      toast(pesanError(e), 'err')
    }
  }

  const terjawab = useMemo(() => Object.keys(jawab).length, [jawab])
  const belum = soal.length - terjawab

  if (loading) {
    return (
      <div className="card card-pad muted small">
        <span className="spinner" /> Memuat soal…
      </div>
    )
  }

  if (err) {
    return (
      <div className="card card-pad">
        <div className="alert alert-danger">
          <span className="alert-ico">
            <Icon name="alert" size={18} />
          </span>
          <div>
            <b>Gagal memuat ujian</b>
            {err}
          </div>
        </div>
        <button className="btn mt-16" onClick={() => nav('/peserta')}>
          <Icon name="arrowLeft" size={15} /> Kembali ke dashboard
        </button>
      </div>
    )
  }

  const s = soal[idx]
  const statusCam = !proctor.camOk
    ? 'Kamera belum aktif'
    : proctor.status === 'Normal'
      ? 'Wajah terdeteksi'
      : proctor.status

  return (
    <div className="exam-shell">
      {/* ---------------------------- bar atas ---------------------------- */}
      <header className="exam-bar">
        <div className="exam-title">
          <b>{data?.ujian?.judul_mata_kuliah}</b>
          <span>
            Soal {idx + 1} dari {soal.length}
          </span>
        </div>
        <div className="spacer" />

        <div className="flex items-center gap-8" style={{ fontSize: 12, color: 'var(--ink-500)' }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              display: 'inline-block',
              background: proctor.camOk ? 'var(--green-500, #12b76a)' : '#98a2b3',
            }}
          />
          <span>{proctor.camOk ? 'Kamera aktif' : 'Kamera belum aktif'}</span>
        </div>

        <div className="timer">
          <div>
            <div className="t-label">Sisa waktu</div>
            <div className="t-value">{durasi(sisa)}</div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setModal(true)}>
          Selesai ujian
        </button>
      </header>

      {/* ---------------------------- layout ---------------------------- */}
      <div className="exam-layout">
        <section className="q-card">
          <div className="q-head">
            <div className="q-no">
              Soal <span>{idx + 1}</span>
            </div>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() =>
                setFlag((prev) => {
                  const next = new Set(prev)
                  next.has(s.nomor_urut) ? next.delete(s.nomor_urut) : next.add(s.nomor_urut)
                  return next
                })
              }
              style={
                flag.has(s.nomor_urut)
                  ? { color: 'var(--amber-600)', background: 'var(--amber-100)', borderColor: '#fedf89' }
                  : undefined
              }
            >
              Tandai ragu-ragu
            </button>
          </div>

          <div className="q-body">
            <div className="q-text">{s?.teks_soal}</div>

            <div className="opt-list">
              {HURUF.filter((h) => s?.opsi?.[h]).map((h) => (
                <label className={`opt ${jawab[s.id_soal] === h ? 'is-checked' : ''}`} data-opt={h} key={h}>
                  <input
                    type="radio"
                    name="jawaban"
                    value={h}
                    checked={jawab[s.id_soal] === h}
                    onChange={() => pilih(h)}
                  />
                  <span className="key">{h}</span>
                  <span className="txt">{s.opsi[h]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="q-foot">
            <button className="btn" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
              Sebelumnya
            </button>
            <div className="spacer" />
            <span className="small muted">{note}</span>
            <button
              className="btn btn-primary"
              onClick={() => setIdx((i) => Math.min(soal.length - 1, i + 1))}
              disabled={idx === soal.length - 1}
            >
              {idx === soal.length - 1 ? 'Soal terakhir' : 'Berikutnya'}
            </button>
          </div>
        </section>

        {/* ---------------------------- navigator ---------------------------- */}
        <aside className="side-card">
          <div className="head">
            <span>Navigator soal</span>
            <span className="small muted">
              {terjawab}/{soal.length}
            </span>
          </div>
          <div className="nav-grid">
            {soal.map((q, i) => (
              <button
                key={q.id_soal}
                onClick={() => setIdx(i)}
                className={`${jawab[q.id_soal] ? 'answered' : ''} ${flag.has(q.nomor_urut) ? 'flagged' : ''} ${
                  i === idx ? 'current' : ''
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="side-stats">
            <div className="box">
              <b>{terjawab}</b>
              <span>Terjawab</span>
            </div>
            <div className="box">
              <b>{belum}</b>
              <span>Belum</span>
            </div>
          </div>
          <div className="nav-legend">
            <div className="li">
              <span className="sw on" /> Sudah dijawab
            </div>
            <div className="li">
              <span className="sw" /> Belum dijawab
            </div>
            <div className="li">
              <span className="sw flag" /> Ditandai ragu
            </div>
          </div>
        </aside>
      </div>

      {/* ---------------------------- panel kamera ---------------------------- */}
      <div className={`cam-panel${camMin ? ' collapsed' : ''}`}>
        <div className="cam-head">
          <span className="dot" style={{ background: proctor.camOk ? '#12b76a' : '#98a2b3' }} />
          <span>Proctoring</span>
          <span className="spacer" />
          <button className="toggle" onClick={() => setCamMin((v) => !v)} title={camMin ? 'Perbesar' : 'Perkecil'}>
            {camMin ? '+' : '−'}
          </button>
        </div>
        <div className="cam-view">
          <video ref={proctor.videoRef} autoPlay muted playsInline />
          {!proctor.camOk && (
            <div className="off">
              Kamera tidak aktif.
              <br />
              {proctor.camError || 'Izinkan akses kamera di peramban.'}
            </div>
          )}
        </div>
        <div className={`status-line ${proctor.status === 'Normal' && proctor.camOk ? 'ok' : 'warn'}`}>
          {proctor.camOk ? statusCam : 'Kamera tidak aktif'}
        </div>
        <div className="cam-foot">
          <span>
            Pelanggaran: <b>{proctor.stats.violations}</b>
          </span>
          <span>{proctor.mode === 'none' ? '—' : proctor.mode}</span>
        </div>
        <canvas ref={proctor.canvasRef} style={{ display: 'none' }} />
      </div>

      {/* ---------------------------- overlay peringatan ---------------------------- */}
      {warn && (
        <div className="warn-overlay open">
          <div className="warn-box">
            <div className="ring">
              <Icon name="alert" size={30} stroke={1.6} />
            </div>
            <h3>{warn.jenis}</h3>
            <p>{warn.keterangan || 'Pastikan kamu berada di depan kamera.'}</p>
            <div className="counter">
              Peringatan {warnCount} dari 12 · {jamDetik(new Date().toISOString())}
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => setWarn(null)}>
              Saya mengerti
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------- modal selesai ---------------------------- */}
      {modal && (
        <div className="modal-backdrop open" onMouseDown={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <h3>Selesaikan ujian?</h3>
                <div className="sub">Setelah dikirim, jawaban tidak dapat diubah lagi.</div>
              </div>
              <button className="x" onClick={() => setModal(false)} aria-label="Tutup">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="summary-list">
                <div className="summary-row">
                  <span>Total soal</span>
                  <b>{soal.length}</b>
                </div>
                <div className="summary-row">
                  <span>Sudah dijawab</span>
                  <b>{terjawab}</b>
                </div>
                <div className="summary-row">
                  <span>Belum dijawab</span>
                  <b>{belum}</b>
                </div>
                <div className="summary-row">
                  <span>Ditandai ragu</span>
                  <b>{flag.size}</b>
                </div>
                <div className="summary-row">
                  <span>Pelanggaran tercatat</span>
                  <b>{proctor.stats.violations}</b>
                </div>
              </div>
              {belum > 0 && (
                <div className="alert alert-warn mt-16">
                  <span className="alert-ico">⚠️</span>
                  <div>Masih ada soal yang belum dijawab. Soal kosong dinilai salah.</div>
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setModal(false)}>
                Periksa lagi
              </button>
              <button className="btn btn-primary" onClick={() => selesai(false)} disabled={mengirim}>
                {mengirim ? (
                  <>
                    <span className="spinner" /> Mengirim…
                  </>
                ) : (
                  'Kirim jawaban'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
