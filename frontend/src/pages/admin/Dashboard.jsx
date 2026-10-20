import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../lib/icons'
import Api, { pesanError } from '../../lib/api'
import { tanggal, jam, jamDetik, durasiMenit, JENIS_WARNA } from '../../lib/format'
import { useToast } from '../../components/ui'

export default function AdminDashboard() {
  const toast = useToast()
  const [ringkas, setRingkas] = useState(null)
  const [logs, setLogs] = useState([])
  const [ujian, setUjian] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([Api.ringkasan(), Api.laporanProctoring(), Api.listUjian()])
      .then(([r, l, u]) => {
        if (!alive) return
        setRingkas(r.data)
        setLogs(l.data || [])
        setUjian(u.data || [])
      })
      .catch((e) => {
        if (!alive) return
        setErr(pesanError(e))
        toast(pesanError(e), 'err')
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pelanggaran = useMemo(() => logs.filter((l) => l.jenis_pelanggaran !== 'Normal'), [logs])

  const distribusi = useMemo(() => {
    const map = {}
    pelanggaran.forEach((l) => {
      map[l.jenis_pelanggaran] = (map[l.jenis_pelanggaran] || 0) + 1
    })
    const arr = Object.entries(map).sort((a, b) => b[1] - a[1])
    const max = Math.max(1, ...arr.map(([, n]) => n))
    return { arr, max, total: pelanggaran.length }
  }, [pelanggaran])

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <p>Ringkasan aktivitas ujian dan integritas peserta.</p>
      </div>

      {err && (
        <div className="alert alert-danger mb-16">
          <span className="alert-ico">
            <Icon name="alert" size={18} />
          </span>
          <div>
            <b>Gagal memuat data</b>
            {err}
          </div>
        </div>
      )}

      {/* ---------------- statistik ---------------- */}
      <div className="stat-grid mb-24">
        <div className="stat">
          <div className="stat-label">Total peserta</div>
          <div className="stat-value">{ringkas?.total_peserta ?? '–'}</div>
          <div className="stat-sub">akun terdaftar</div>
          <div className="stat-ico">
            <Icon name="users" size={17} />
          </div>
        </div>
        <div className="stat accent-green">
          <div className="stat-label">Ujian aktif</div>
          <div className="stat-value">{ringkas?.ujian_aktif ?? '–'}</div>
          <div className="stat-sub">dari {ringkas?.total_ujian ?? 0} ujian</div>
          <div className="stat-ico">
            <Icon name="exam" size={17} />
          </div>
        </div>
        <div className="stat accent-red">
          <div className="stat-label">Total pelanggaran</div>
          <div className="stat-value">{ringkas?.total_pelanggaran ?? '–'}</div>
          <div className="stat-sub">tercatat sistem</div>
          <div className="stat-ico">
            <Icon name="shield" size={17} />
          </div>
        </div>
        <div className="stat accent-amber">
          <div className="stat-label">Rata-rata skor</div>
          <div className="stat-value">
            {ringkas ? Number(ringkas.rata_rata_skor).toFixed(2) : '–'}
          </div>
          <div className="stat-sub">dari ujian selesai</div>
          <div className="stat-ico">
            <Icon name="chart" size={17} />
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.35fr) minmax(0,1fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* ---------------- pelanggaran terbaru ---------------- */}
        <section className="card">
          <div className="card-head">
            <h3>Pelanggaran terbaru</h3>
            <Link className="btn btn-sm btn-ghost" to="/admin/laporan">
              Lihat semua
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Peserta</th>
                  <th>Jenis</th>
                  <th>Ujian</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {pelanggaran.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">Belum ada pelanggaran tercatat.</div>
                    </td>
                  </tr>
                )}
                {pelanggaran.slice(0, 6).map((l) => (
                  <tr key={l.id_log}>
                    <td>
                      <div className="strong small">{l.nama_peserta}</div>
                      <div className="tiny muted">{l.username_peserta}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${JENIS_WARNA[l.jenis_pelanggaran] || 'blue'}`}>
                        {l.jenis_pelanggaran}
                      </span>
                    </td>
                    <td className="small">{l.mata_kuliah || '—'}</td>
                    <td className="small num nowrap">
                      {jamDetik(l.waktu_kejadian)}
                      <div className="tiny muted">{tanggal(l.waktu_kejadian)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------------- distribusi ---------------- */}
        <section className="card">
          <div className="card-head">
            <h3>Distribusi jenis pelanggaran</h3>
          </div>
          <div className="card-body">
            {distribusi.arr.length === 0 && <div className="muted small">Belum ada data.</div>}
            {distribusi.arr.map(([jenis, n]) => (
              <div key={jenis} style={{ marginBottom: 14 }}>
                <div className="between mb-8">
                  <span className="small strong">{jenis}</span>
                  <span className="small num muted">
                    {n} · {Math.round((n / distribusi.total) * 100)}%
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--line)', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(n / distribusi.max) * 100}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: 'linear-gradient(90deg,var(--blue-500),#38bdf8)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ---------------- daftar ujian ---------------- */}
      <section className="card mt-24">
        <div className="card-head">
          <h3>Daftar ujian</h3>
          <Link className="btn btn-sm" to="/admin/ujian">
            <Icon name="arrowRight" size={15} /> Kelola ujian
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Tanggal</th>
                <th>Durasi</th>
                <th className="right">Soal</th>
                <th className="right">Peserta</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ujian.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">Belum ada ujian.</div>
                  </td>
                </tr>
              )}
              {ujian.map((u) => (
                <tr key={u.id_ujian}>
                  <td className="strong">{u.judul_mata_kuliah}</td>
                  <td className="small nowrap">{tanggal(u.tanggal)}</td>
                  <td className="small nowrap">{durasiMenit(u.durasi_menit)}</td>
                  <td className="right num">{u.jumlah_soal}</td>
                  <td className="right num">{u.jumlah_peserta ?? 0}</td>
                  <td>
                    {u.status_aktif ? (
                      <span className="badge badge-green badge-dot">Aktif</span>
                    ) : (
                      <span className="badge">Nonaktif</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
