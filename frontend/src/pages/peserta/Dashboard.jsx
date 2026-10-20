import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../lib/icons'
import Api, { pesanError } from '../../lib/api'
import { tanggal, jam, tanggalPanjang, durasiMenit } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui'

export default function PesertaDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const nav = useNavigate()

  const [rows, setRows] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [mulai, setMulai] = useState(null)

  const muat = async () => {
    setMemuat(true)
    try {
      const res = await Api.listUjian()
      setRows(res.data || [])
    } catch (e) {
      toast(pesanError(e), 'err')
    } finally {
      setMemuat(false)
    }
  }

  useEffect(() => {
    muat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statusOf = (u) => {
    const r = u.rekam
    if (r?.status_pengerjaan === 'selesai') return { key: 'selesai', label: 'Selesai', cls: 'badge-green' }
    if (r?.status_pengerjaan === 'diskualifikasi')
      return { key: 'dq', label: 'Diskualifikasi', cls: 'badge-red' }
    if (r?.status_pengerjaan === 'sedang_mengerjakan')
      return { key: 'jalan', label: 'Sedang dikerjakan', cls: 'badge-amber' }
    if (u.status_aktif) return { key: 'buka', label: 'Dibuka', cls: 'badge-blue' }
    return { key: 'tutup', label: 'Belum dibuka', cls: '' }
  }

  const riwayat = useMemo(
    () =>
      rows
        .filter((u) => u.rekam)
        .map((u) => ({
          ...u.rekam,
          judul_mata_kuliah: u.judul_mata_kuliah,
          tanggal: u.tanggal,
        })),
    [rows]
  )

  const stat = useMemo(() => {
    const selesai = riwayat.filter((r) => r.status_pengerjaan === 'selesai')
    const skor = selesai.map((r) => Number(r.skor_akhir) || 0)
    const langgar = riwayat.reduce((a, r) => a + (Number(r.jumlah_pelanggaran) || 0), 0)
    return {
      aktif: rows.filter((u) => u.status_aktif).length,
      selesai: selesai.length,
      rata: skor.length ? (skor.reduce((a, b) => a + b, 0) / skor.length).toFixed(1) : '—',
      langgar,
    }
  }, [rows, riwayat])

  const mulaiUjian = async (u) => {
    setMulai(u.id_ujian)
    try {
      const res = await Api.mulaiUjian(u.id_ujian)
      nav(`/peserta/ujian/${res.data.rekam.id_rekam_jejak}`)
    } catch (e) {
      const rekamId = e?.response?.data?.rekam?.id_rekam_jejak
      if (rekamId) nav(`/peserta/hasil/${rekamId}`)
      else toast(pesanError(e), 'err')
    } finally {
      setMulai(null)
    }
  }

  const examCard = (u) => {
    const st = statusOf(u)
    const r = u.rekam

    let aksi
    if (st.key === 'selesai' || st.key === 'dq') {
      aksi = (
        <Link className="btn btn-sm" to={`/peserta/hasil/${r.id_rekam_jejak}`}>
          <Icon name="eye" size={15} /> Lihat hasil
        </Link>
      )
    } else if (st.key === 'jalan') {
      aksi = (
        <Link className="btn btn-primary btn-sm" to={`/peserta/ujian/${r.id_rekam_jejak}`}>
          <Icon name="play" size={14} /> Lanjutkan
        </Link>
      )
    } else if (st.key === 'buka') {
      aksi = (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => mulaiUjian(u)}
          disabled={mulai === u.id_ujian}
        >
          {mulai === u.id_ujian ? (
            <>
              <span className="spinner" /> Menyiapkan…
            </>
          ) : (
            <>
              <Icon name="play" size={14} /> Mulai ujian
            </>
          )}
        </button>
      )
    } else {
      aksi = (
        <button className="btn btn-sm" disabled>
          Belum dibuka
        </button>
      )
    }

    return (
      <article className={`exam-card ${st.key === 'buka' || st.key === 'jalan' ? 'is-active' : ''}`} key={u.id_ujian}>
        <div className="top">
          <h3>{u.judul_mata_kuliah}</h3>
          <span className={`badge ${st.cls} badge-dot`}>{st.label}</span>
        </div>

        <div className="exam-meta">
          <div className="row">
            <Icon name="calendar" size={15} /> {tanggal(u.tanggal)}
          </div>
          <div className="row">
            <Icon name="clock" size={15} /> {jam(u.waktu_mulai)}–{jam(u.waktu_selesai)} ·{' '}
            {durasiMenit(u.durasi_menit)}
          </div>
          <div className="row">
            <Icon name="question" size={15} /> {u.jumlah_soal} soal pilihan ganda
          </div>
        </div>

        {r && r.skor_akhir != null && (
          <div className="small" style={{ color: 'var(--green-600)', fontWeight: 600 }}>
            Skor akhir: {Number(r.skor_akhir).toFixed(2)}
          </div>
        )}

        <div className="flex gap-8" style={{ marginTop: 'auto' }}>
          {aksi}
        </div>
      </article>
    )
  }

  return (
    <>
      <section className="welcome">
        <div>
          <h1>Halo, {user?.nama_lengkap?.split(' ')[0] || 'Peserta'} 👋</h1>
          <p>Pilih ujian yang tersedia di bawah ini.</p>
          <span className="pill">{tanggalPanjang(new Date())}</span>
        </div>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'right' }}>
          <div className="tiny" style={{ color: '#a9c1d8' }}>
            Status akun
          </div>
          <div style={{ fontSize: 15, fontWeight: 650 }}>Aktif</div>
        </div>
      </section>

      <div className="stat-grid mb-24">
        <div className="stat">
          <div className="stat-label">Ujian tersedia</div>
          <div className="stat-value">{stat.aktif}</div>
          <div className="stat-sub">sedang dibuka</div>
          <div className="stat-ico">
            <Icon name="exam" size={17} />
          </div>
        </div>
        <div className="stat accent-green">
          <div className="stat-label">Ujian selesai</div>
          <div className="stat-value">{stat.selesai}</div>
          <div className="stat-sub">sudah dikerjakan</div>
          <div className="stat-ico">
            <Icon name="check" size={17} />
          </div>
        </div>
        <div className="stat accent-amber">
          <div className="stat-label">Rata-rata skor</div>
          <div className="stat-value">{stat.rata}</div>
          <div className="stat-sub">dari ujian selesai</div>
          <div className="stat-ico">
            <Icon name="chart" size={17} />
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Catatan pelanggaran</div>
          <div className="stat-value">{stat.langgar}</div>
          <div className="stat-sub">selama ujian</div>
          <div className="stat-ico">
            <Icon name="shield" size={17} />
          </div>
        </div>
      </div>

      <div className="between mb-16">
        <div>
          <h2 style={{ fontSize: 18 }}>Ujian</h2>
          <p className="small muted" style={{ margin: '2px 0 0' }}>
            Klik mulai untuk masuk ke ruang ujian. Kamera akan diaktifkan.
          </p>
        </div>
        <button className="btn btn-sm" onClick={muat}>
          <Icon name="refresh" size={15} /> Muat ulang
        </button>
      </div>

      {memuat ? (
        <div className="card card-pad muted small">Memuat daftar ujian…</div>
      ) : rows.length === 0 ? (
        <div className="card card-pad muted small">Belum ada ujian yang dibuka untuk akunmu.</div>
      ) : (
        <div className="exam-grid">{rows.map(examCard)}</div>
      )}

      <div className="between mt-24 mb-16">
        <h2 style={{ fontSize: 18 }}>Riwayat pengerjaan</h2>
        <span className="small muted">{riwayat.length} entri</span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ujian</th>
                <th>Tanggal</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th className="right">Skor</th>
                <th className="right">Pelanggaran</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {riwayat.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">Belum ada riwayat ujian.</div>
                  </td>
                </tr>
              )}
              {riwayat.map((r) => {
                const langgar = Number(r.jumlah_pelanggaran) || 0
                return (
                  <tr key={r.id_rekam_jejak}>
                    <td className="strong">{r.judul_mata_kuliah}</td>
                    <td className="small">{tanggal(r.tanggal || r.waktu_mulai)}</td>
                    <td className="small num">{jam(r.waktu_mulai)}</td>
                    <td className="small num">{r.waktu_selesai ? jam(r.waktu_selesai) : '—'}</td>
                    <td className="right strong num">
                      {r.skor_akhir != null ? Number(r.skor_akhir).toFixed(2) : '—'}
                    </td>
                    <td className="right">
                      {langgar === 0 ? (
                        <span className="muted small">0</span>
                      ) : (
                        <span className={`badge ${langgar > 3 ? 'badge-red' : 'badge-amber'}`}>
                          {langgar}
                        </span>
                      )}
                    </td>
                    <td>
                      {r.status_pengerjaan === 'selesai' ? (
                        <span className="badge badge-green">Selesai</span>
                      ) : r.status_pengerjaan === 'diskualifikasi' ? (
                        <span className="badge badge-red">Diskualifikasi</span>
                      ) : (
                        <span className="badge badge-amber">Berjalan</span>
                      )}
                    </td>
                    <td className="right">
                      <Link className="btn btn-sm btn-ghost" to={`/peserta/hasil/${r.id_rekam_jejak}`}>
                        <Icon name="eye" size={15} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="alert alert-info mt-24">
        <span className="alert-ico">
          <Icon name="shield" size={18} />
        </span>
        <div>
          <b>Sebelum mulai</b>
          Pastikan kamera menghadap wajahmu, pencahayaan cukup, dan tidak ada orang lain di sekitar.
          Sistem memantau frame kamera setiap 3 detik selama ujian berlangsung.
        </div>
      </div>
    </>
  )
}
