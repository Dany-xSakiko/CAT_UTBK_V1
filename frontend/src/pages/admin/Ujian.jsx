import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../lib/icons'
import Api, { pesanError } from '../../lib/api'
import { tanggal, jam, durasiMenit } from '../../lib/format'
import { Modal, Tombol, useToast, useConfirm } from '../../components/ui'

const KOSONG = {
  judul_mata_kuliah: '',
  tanggal: '',
  tanggalSalah: false,
  durasi_menit: 30,
  waktu_mulai: '08:00',
  waktu_selesai: '09:00',
  status_aktif: false,
}

export default function AdminUjian() {
  const toast = useToast()
  const confirm = useConfirm()

  const [rows, setRows] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [cari, setCari] = useState('')
  const [status, setStatus] = useState('')
  const [err, setErr] = useState('')

  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState(KOSONG)
  const [salah, setSalah] = useState({})
  const [simpan, setSimpan] = useState(false)

  const muat = async () => {
    setMemuat(true)
    try {
      const res = await Api.listUjian()
      setRows(res.data || [])
      setErr('')
    } catch (e) {
      setErr(pesanError(e))
    } finally {
      setMemuat(false)
    }
  }

  useEffect(() => {
    muat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const data = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return rows.filter((u) => {
      const okCari = !q || u.judul_mata_kuliah?.toLowerCase().includes(q)
      const okStatus = status === '' ? true : status === '1' ? !!u.status_aktif : !u.status_aktif
      return okCari && okStatus
    })
  }, [rows, cari, status])

  const bukaForm = (u) => {
    setEdit(u || null)
    setSalah({})
    setForm(
      u
        ? {
            judul_mata_kuliah: u.judul_mata_kuliah,
            tanggal: String(u.tanggal).slice(0, 10),
            durasi_menit: Number(u.durasi_menit),
            waktu_mulai: jam(u.waktu_mulai),
            waktu_selesai: jam(u.waktu_selesai),
            status_aktif: !!u.status_aktif,
          }
        : { ...KOSONG, tanggal: new Date().toISOString().slice(0, 10) }
    )
    setOpen(true)
  }

  const simpanForm = async () => {
    const errs = {}
    if (!form.judul_mata_kuliah.trim()) errs.judul = true
    if (!form.tanggal) errs.tanggal = true
    const d = Number(form.durasi_menit)
    if (!(d >= 1 && d <= 300)) errs.durasi = true
    setSalah(errs)
    if (Object.keys(errs).length) return

    setSimpan(true)
    try {
      const payload = {
        judul_mata_kuliah: form.judul_mata_kuliah.trim(),
        tanggal: form.tanggal,
        waktu_mulai: form.waktu_mulai || '08:00',
        waktu_selesai: form.waktu_selesai || '09:00',
        durasi_menit: d,
        status_aktif: form.status_aktif,
      }
      if (edit) await Api.updateUjian(edit.id_ujian, payload)
      else await Api.createUjian(payload)
      setOpen(false)
      toast(edit ? 'Perubahan tersimpan.' : 'Ujian ditambahkan.')
      muat()
    } catch (e) {
      toast(pesanError(e), 'err')
    } finally {
      setSimpan(false)
    }
  }

  const toggle = async (u) => {
    try {
      await Api.updateUjian(u.id_ujian, {
        judul_mata_kuliah: u.judul_mata_kuliah,
        tanggal: String(u.tanggal).slice(0, 10),
        waktu_mulai: jam(u.waktu_mulai),
        waktu_selesai: jam(u.waktu_selesai),
        durasi_menit: Number(u.durasi_menit),
        status_aktif: !u.status_aktif,
      })
      toast(u.status_aktif ? 'Ujian ditutup.' : 'Ujian dibuka untuk peserta.')
      muat()
    } catch (e) {
      toast(pesanError(e), 'err')
    }
  }

  const hapus = async (u) => {
    const ok = await confirm({
      title: 'Hapus ujian?',
      message: `"${u.judul_mata_kuliah}" beserta soalnya akan dihapus permanen.`,
      yes: 'Hapus ujian',
    })
    if (!ok) return
    try {
      await Api.deleteUjian(u.id_ujian)
      toast('Ujian dihapus.')
      muat()
    } catch (e) {
      toast(pesanError(e), 'err')
    }
  }

  return (
    <>
      <div className="between mb-16">
        <div className="page-head mb-0">
          <h1>Data ujian</h1>
          <p>Atur jadwal, durasi, dan status pembukaan ujian.</p>
        </div>
        <button className="btn btn-primary" onClick={() => bukaForm(null)}>
          <Icon name="plus" size={16} /> Tambah ujian
        </button>
      </div>

      <div className="filter-bar">
        <div className="field grow">
          <label htmlFor="fCari">Cari judul</label>
          <input
            className="input"
            id="fCari"
            placeholder="Ketik judul mata kuliah…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="fStatus">Status</label>
          <select className="select" id="fStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua</option>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select>
        </div>
        <button
          className="btn"
          onClick={() => {
            setCari('')
            setStatus('')
          }}
        >
          Reset
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>#</th>
                <th>Judul ujian</th>
                <th>Tanggal</th>
                <th>Waktu</th>
                <th>Durasi</th>
                <th className="right">Soal</th>
                <th className="right">Peserta</th>
                <th>Status</th>
                <th className="right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {memuat && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">Memuat data…</div>
                  </td>
                </tr>
              )}

              {!memuat && err && (
                <tr>
                  <td colSpan={9}>
                    <div className="alert alert-danger" style={{ margin: 16 }}>
                      <span className="alert-ico">
                        <Icon name="alert" size={18} />
                      </span>
                      <div>
                        <b>Gagal memuat</b>
                        {err}
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {!memuat && !err && data.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      {rows.length
                        ? 'Tidak ada ujian yang cocok dengan filter.'
                        : 'Belum ada ujian. Tambahkan ujian pertama.'}
                    </div>
                  </td>
                </tr>
              )}

              {!memuat &&
                data.map((u, i) => (
                  <tr key={u.id_ujian}>
                    <td className="num muted">{i + 1}</td>
                    <td>
                      <div className="strong">{u.judul_mata_kuliah}</div>
                      <div className="tiny muted">ID #{u.id_ujian}</div>
                    </td>
                    <td className="small nowrap">{tanggal(u.tanggal)}</td>
                    <td className="small nowrap num">
                      {jam(u.waktu_mulai)}–{jam(u.waktu_selesai)}
                    </td>
                    <td className="small nowrap">{durasiMenit(u.durasi_menit)}</td>
                    <td className="right num">
                      <Link to={`/admin/soal?ujian=${u.id_ujian}`} title="Kelola soal">
                        {u.jumlah_soal ?? 0}
                      </Link>
                    </td>
                    <td className="right num">{u.jumlah_peserta ?? 0}</td>
                    <td>
                      {u.status_aktif ? (
                        <span className="badge badge-green badge-dot">Aktif</span>
                      ) : (
                        <span className="badge">Nonaktif</span>
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => toggle(u)}
                          title={u.status_aktif ? 'Tutup' : 'Buka'} 
                        >
                          <Icon name={u.status_aktif ? 'lock' : 'play'} size={15} />
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => bukaForm(u)} title="Edit">
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => hapus(u)}
                          title="Hapus"
                          style={{ color: 'var(--red-600)' }}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="small muted mt-8">
        {data.length} dari {rows.length} ujian ditampilkan.
      </div>

      {/* ---------------- modal form ---------------- */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        wide
        title={edit ? 'Edit ujian' : 'Tambah ujian'}
        subtitle={edit ? `Mengubah data ujian #${edit.id_ujian}` : 'Isi detail ujian di bawah ini.'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>
              Batal
            </button>
            <Tombol loading={simpan} onClick={simpanForm} className="btn btn-primary">
              Simpan
            </Tombol>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            simpanForm()
          }}
          noValidate
        >
          <div className={`field${salah.judul ? ' has-error' : ''}`}>
            <label htmlFor="judul">Judul / mata kuliah</label>
            <input
              className="input"
              id="judul"
              placeholder="cth. Tes Potensi Skolastik — Penalaran Umum"
              value={form.judul_mata_kuliah}
              onChange={(e) => setForm({ ...form, judul_mata_kuliah: e.target.value })}
              required
            />
            <div className="form-error">Judul wajib diisi.</div>
          </div>

          <div className="form-row">
            <div className={`field${salah.tanggal ? ' has-error' : ''}`}>
              <label htmlFor="tanggal">Tanggal</label>
              <input
                className="input"
                id="tanggal"
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                required
              />
              <div className="form-error">Tanggal wajib diisi.</div>
            </div>
            <div className={`field${salah.durasi ? ' has-error' : ''}`}>
              <label htmlFor="durasi">Durasi (menit)</label>
              <input
                className="input"
                id="durasi"
                type="number"
                min="1"
                max="300"
                value={form.durasi_menit}
                onChange={(e) => setForm({ ...form, durasi_menit: e.target.value })}
                required
              />
              <div className="form-error">Durasi harus antara 1–300 menit.</div>
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="mulai">Waktu mulai</label>
              <input
                className="input"
                id="mulai"
                type="time"
                value={form.waktu_mulai}
                onChange={(e) => setForm({ ...form, waktu_mulai: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="selesai">Waktu selesai</label>
              <input
                className="input"
                id="selesai"
                type="time"
                value={form.waktu_selesai}
                onChange={(e) => setForm({ ...form, waktu_selesai: e.target.value })}
              />
            </div>
          </div>

          <label className="flex items-center gap-8" style={{ cursor: 'pointer', marginBottom: 4 }}>
            <input
              type="checkbox"
              checked={form.status_aktif}
              onChange={(e) => setForm({ ...form, status_aktif: e.target.checked })}
            />
            <span className="small">
              <b>Buka ujian untuk peserta</b>
              <br />
              <span className="muted">Peserta hanya bisa mulai jika status aktif.</span>
            </span>
          </label>
        </form>
      </Modal>
    </>
  )
}
