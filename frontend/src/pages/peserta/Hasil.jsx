import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Icon from '../../lib/icons'
import Api, { pesanError } from '../../lib/api'
import { tanggal, jam, jamDetik, durasi } from '../../lib/format'
import { useToast } from '../../components/ui'

export default function PesertaHasil() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    Api.getRekam(id)
      .then((r) => setData(r.data))
      .catch((e) => {
        setErr(pesanError(e))
        toast(pesanError(e), 'err')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const r = data?.rekam
  const skor = Number(r?.skor_akhir || 0)

  const ring = (nilai) => {
    const rad = 66
    const keliling = 2 * Math.PI * rad
    const pct = Math.max(0, Math.min(100, Number(nilai) || 0))
    const dash = (pct / 100) * keliling
    const warna =
      pct >= 75 ? 'var(--green-600)' : pct >= 50 ? 'var(--amber-600)' : 'var(--red-600)'
    return (
      <>
        <svg width="148" height="148" viewBox="0 0 148 148">
          <circle cx="74" cy="74" r={rad} fill="none" stroke="#eef1f5" strokeWidth="12" />
          <circle
            cx="74"
            cy="74"
            r={rad}
            fill="none"
            stroke={warna}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${keliling - dash}`}
            style={{ transition: 'stroke-dasharray .6s ease' }}
          />
        </svg>
        <div className="val">
          <div>
            <b style={{ color: warna }}>{pct.toFixed(1)}</b>
            <span>skor</span>
          </div>
        </div>
      </>
    )
  }

  const soal = data?.soal || []
  const log = data?.log || []
  const pelanggaran = useMemo(() => log.filter((l) => l.jenis_pelanggaran !== 'Normal'), [log])

  const lamaKerja = useMemo(() => {
    if (!r?.waktu_mulai || !r?.waktu_selesai) return '—'
    const a = new Date(r.waktu_mulai).getTime()
    const b = new Date(r.waktu_selesai).getTime()
    if (Number.isNaN(a) || Number.isNaN(b)) return '—'
    return durasi(Math.max(0, Math.round((b - a) / 1000)))
  }, [r])

  if (err) {
    return (
      <div className="card card-pad">
        <div className="alert alert-danger">
          <span className="alert-ico">
            <Icon name="alert" size={18} />
          </span>
          <div>
            <b>Gagal memuat hasil</b>
            {err}
          </div>
        </div>
        <button className="btn mt-16" onClick={() => nav('/peserta')}>
          <Icon name="arrowLeft" size={15} /> Kembali ke dashboard
        </button>
      </div>
    )
  }

  if (!data) {
    return <div className="card card-pad muted small">Memuat hasil ujian…</div>
  }

  return (
    <>
      <div className="between mb-16">
        <button className="btn btn-sm" onClick={() => nav('/peserta')}>
          <Icon name="arrowLeft" size={15} /> Kembali ke dashboard
        </button>
        <span className="small muted">
          {data.ujian?.judul_mata_kuliah} · {tanggal(data.ujian?.tanggal)}
        </span>
      </div>

      {/* ---------------------------- hero skor ---------------------------- */}
      <section className="result-hero">
        <div className="score-ring">{ring(skor)}</div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-500)',
            textTransform: 'uppercase',
            letterSpacing: '.07em',
            fontWeight: 600,
          }}
        >
          Skor akhir
        </div>
        <h2 style={{ marginTop: 4 }}>{data.ujian?.judul_mata_kuliah}</h2>
        <p className="muted small mb-0">
          {tanggal(data.ujian?.tanggal)} · mulai {jam(r?.waktu_mulai)} · durasi{' '}
          {data.ujian?.durasi_menit} menit
        </p>

        <div className="result-grid">
          <div className="box">
            <span>Total soal</span>
            <b>{r?.total_soal ?? soal.length}</b>
          </div>
          <div className="box">
            <span>Benar</span>
            <b style={{ color: 'var(--green-600)' }}>{r?.total_benar ?? 0}</b>
          </div>
          <div className="box">
            <span>Salah / kosong</span>
            <b style={{ color: 'var(--red-600)' }}>{r?.total_salah ?? 0}</b>
          </div>
          <div className="box">
            <span>Waktu pengerjaan</span>
            <b>{lamaKerja}</b>
          </div>
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* ---------------------------- rincian jawaban ---------------------------- */}
        <section className="card">
          <div className="card-head">
            <h3>Rincian jawaban</h3>
            <span className="small muted">
              {r?.total_benar ?? 0}/{r?.total_soal ?? soal.length} benar
            </span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>No</th>
                  <th>Soal</th>
                  <th style={{ width: 88 }} className="center">
                    Jawaban
                  </th>
                  <th style={{ width: 88 }} className="center">
                    Kunci
                  </th>
                  <th style={{ width: 90 }}>Hasil</th>
                </tr>
              </thead>
              <tbody>
                {soal.map((s) => {
                  const jw = s.jawaban_peserta
                  const benar = s.benar === true
                  const pendek = String(s.teks_soal || '')
                    .replace(/\s+/g, ' ')
                    .trim()
                  return (
                    <tr key={s.id_soal}>
                      <td className="num strong">{s.nomor_urut}</td>
                      <td className="small">{pendek.length > 96 ? `${pendek.slice(0, 96)}…` : pendek}</td>
                      <td className="center">
                        <b>{jw || '—'}</b>
                      </td>
                      <td className="center" style={{ color: 'var(--green-600)', fontWeight: 600 }}>
                        {s.kunci_jawaban || '—'}
                      </td>
                      <td>
                        {benar ? (
                          <span className="badge badge-green">Benar</span>
                        ) : jw ? (
                          <span className="badge badge-red">Salah</span>
                        ) : (
                          <span className="badge">Kosong</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------------------------- catatan proctoring ---------------------------- */}
        <section className="stack gap-16">
          <div className="card">
            <div className="card-head">
              <h3>Catatan proctoring</h3>
              <span className="badge badge-red">{pelanggaran.length}</span>
            </div>
            <div className="card-body">
              {pelanggaran.length === 0 ? (
                <div className="muted small">Tidak ada pelanggaran tercatat. 🎉</div>
              ) : (
                <div className="timeline">
                  {pelanggaran.map((l) => {
                    const bad =
                      l.jenis_pelanggaran === 'Suspicious Activity' ||
                      l.jenis_pelanggaran === 'Multiple Faces'
                    return (
                      <div className={`tl-item${bad ? ' bad' : ''}`} key={l.id_log}>
                        <div className="tl-head">{l.jenis_pelanggaran}</div>
                        <div className="tl-meta">
                          {jamDetik(l.waktu ?? l.timestamp)} · {l.keterangan || '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="card card-pad">
            <h4 style={{ marginBottom: 8 }}>Apa arti catatan ini?</h4>
            <p className="small muted" style={{ margin: 0 }}>
              Sistem menyimpan setiap anomali yang terdeteksi kamera sebagai bahan pemeriksaan
              panitia. Catatan ini <b>tidak otomatis menggugurkan</b> hasil ujian, kecuali jumlahnya
              melewati batas yang ditetapkan panitia.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
