import { useEffect, useMemo, useState } from 'react'
import Icon from '../../lib/icons'
import Api, { pesanError } from '../../lib/api'
import { tanggal, jamDetik, JENIS_WARNA } from '../../lib/format'
import { Modal, useToast } from '../../components/ui'

export default function AdminLaporan() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [cari, setCari] = useState('')
  const [jenis, setJenis] = useState('')
  const [ujian, setUjian] = useState('')
  const [bukti, setBukti] = useState(null)

  useEffect(() => {
    let alive = true
    Api.laporanProctoring()
      .then((r) => alive && setRows(r.data || []))
      .catch((e) => alive && toast(pesanError(e), 'err'))
      .finally(() => alive && setMemuat(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const daftarUjian = useMemo(() => {
    const set = new Set(rows.map((r) => r.mata_kuliah).filter(Boolean))
    return [...set].sort()
  }, [rows])

  const data = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return rows.filter((r) => {
      const okCari =
        !q ||
        (r.nama_peserta || '').toLowerCase().includes(q) ||
        (r.username_peserta || '').toLowerCase().includes(q)
      const okJenis = !jenis || r.jenis_pelanggaran === jenis
      const okUjian = !ujian || r.mata_kuliah === ujian
      return okCari && okJenis && okUjian
    })
  }, [rows, cari, jenis, ujian])

  const stat = useMemo(() => {
    const peserta = new Set(data.map((r) => r.username_peserta))
    const hitung = {}
    data.forEach((r) => {
      hitung[r.jenis_pelanggaran] = (hitung[r.jenis_pelanggaran] || 0) + 1
    })
    const dominan = Object.entries(hitung).sort((a, b) => b[1] - a[1])[0]
    return { total: data.length, peserta: peserta.size, dominan: dominan ? dominan[0] : '—' }
  }, [data])

  const exportCsv = () => {
    const head = ['Waktu', 'Peserta', 'Username', 'Ujian', 'Jenis', 'Keterangan']
    const lines = data.map((r) =>
      [
        r.waktu_kejadian,
        r.nama_peserta,
        r.username_peserta,
        r.mata_kuliah,
        r.jenis_pelanggaran,
        r.keterangan || '',
      ]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(';')
    )
    const csv = '\uFEFF' + [head.join(';'), ...lines].join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-proctoring-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('CSV diunduh.')
  }

  return (
    <>
      <div className="between mb-16">
        <div className="page-head mb-0">
          <h1>Laporan proctoring</h1>
          <p>Rekap pelanggaran peserta beserta bukti tangkapan kamera.</p>
        </div>
        <button className="btn" onClick={exportCsv} disabled={!data.length}>
          <Icon name="download" size={16} /> Export CSV
        </button>
      </div>

      <div className="filter-bar">
        <div className="field grow">
          <label htmlFor="fCari">Cari peserta</label>
          <input
            className="input"
            id="fCari"
            placeholder="Nama atau username…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="fJenis">Jenis pelanggaran</label>
          <select className="select" id="fJenis" value={jenis} onChange={(e) => setJenis(e.target.value)}>
            <option value="">Semua jenis</option>
            <option value="No Face">No Face</option>
            <option value="Multiple Faces">Multiple Faces</option>
            <option value="Looking Away">Looking Away</option>
            <option value="Suspicious Activity">Suspicious Activity</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="fUjian">Ujian</label>
          <select className="select" id="fUjian" value={ujian} onChange={(e) => setUjian(e.target.value)}>
            <option value="">Semua ujian</option>
            {daftarUjian.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn"
          onClick={() => {
            setCari('')
            setJenis('')
            setUjian('')
          }}
        >
          Reset
        </button>
      </div>

      <div
        className="stat-grid mb-24"
        style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}
      >
        <div className="stat accent-red">
          <div className="stat-label">Total kejadian</div>
          <div className="stat-value" style={{ fontSize: 26 }}>
            {stat.total}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Peserta terlibat</div>
          <div className="stat-value" style={{ fontSize: 26 }}>
            {stat.peserta}
          </div>
        </div>
        <div className="stat accent-amber">
          <div className="stat-label">Jenis dominan</div>
          <div className="stat-value" style={{ fontSize: 18, marginTop: 6 }}>
            {stat.dominan}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Peserta</th>
                <th>Jenis</th>
                <th>Ujian</th>
                <th>Keterangan</th>
                <th className="center">Bukti</th>
              </tr>
            </thead>
            <tbody>
              {memuat && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">Memuat data…</div>
                  </td>
                </tr>
              )}
              {!memuat && data.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">Tidak ada kejadian yang cocok dengan filter.</div>
                  </td>
                </tr>
              )}
              {!memuat &&
                data.map((l) => (
                  <tr key={l.id_log}>
                    <td className="small nowrap">
                      <div className="num">{jamDetik(l.waktu_kejadian)}</div>
                      <div className="tiny muted">{tanggal(l.waktu_kejadian)}</div>
                    </td>
                    <td>
                      <div className="strong small">{l.nama_peserta}</div>
                      <div className="tiny muted">{l.username_peserta}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${JENIS_WARNA[l.jenis_pelanggaran] || ''}`}>
                        {l.jenis_pelanggaran}
                      </span>
                    </td>
                    <td className="small">{l.mata_kuliah || '—'}</td>
                    <td className="small muted">{l.keterangan || '—'}</td>
                    <td className="center">
                      {l.url_bukti ? (
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => setBukti(l)}
                          title="Lihat bukti"
                        >
                          <Icon name="eye" size={15} />
                        </button>
                      ) : (
                        <span className="tiny muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="small muted mt-8">
        {data.length} dari {rows.length} kejadian ditampilkan.
      </div>

      <Modal
        open={!!bukti}
        onClose={() => setBukti(null)}
        title="Bukti tangkapan"
        subtitle={
          bukti ? `${bukti.nama_peserta} · ${bukti.waktu_kejadian} · ${bukti.jenis_pelanggaran}` : '—'
        }
        footer={
          <button className="btn" onClick={() => setBukti(null)}>
            Tutup
          </button>
        }
      >
        {bukti && (
          <div style={{ textAlign: 'center' }}>
            <img
              src={bukti.url_bukti}
              alt="Bukti proctoring"
              style={{ width: '100%', borderRadius: 12, display: 'block', background: '#0b1622' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement.insertAdjacentHTML(
                  'beforeend',
                  '<div class="alert alert-warn"><span class="alert-ico">⚠️</span><div>File bukti tidak ditemukan di server.</div></div>'
                )
              }}
            />
            {bukti.keterangan && (
              <p className="small muted mt-16" style={{ marginBottom: 0 }}>
                {bukti.keterangan}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
