import { useEffect, useMemo, useState } from 'react'
import Icon from '../../lib/icons'
import Api, { pesanError } from '../../lib/api'
import { tanggal } from '../../lib/format'
import { Modal, Tombol, useToast, useConfirm } from '../../components/ui'

const KOSONG = { nama_lengkap: '', username: '', password: '', role: 'Peserta', email: '' }

export default function AdminPengguna() {
  const toast = useToast()
  const confirm = useConfirm()

  const [rows, setRows] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [cari, setCari] = useState('')
  const [role, setRole] = useState('')

  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState(KOSONG)
  const [salah, setSalah] = useState({})
  const [simpan, setSimpan] = useState(false)

  const muat = async () => {
    setMemuat(true)
    try {
      const res = await Api.listPengguna()
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

  const data = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return rows.filter((u) => {
      const okRole = !role || u.role === role
      const okCari =
        !q ||
        u.nama_lengkap?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      return okRole && okCari
    })
  }, [rows, cari, role])

  const stat = useMemo(
    () => ({
      total: rows.length,
      peserta: rows.filter((r) => r.role === 'Peserta').length,
      admin: rows.filter((r) => r.role === 'Admin').length,
    }),
    [rows]
  )

  const bukaForm = (u) => {
    setEdit(u || null)
    setSalah({})
    setForm(
      u
        ? {
            nama_lengkap: u.nama_lengkap,
            username: u.username,
            password: '',
            role: u.role,
            email: u.email || '',
          }
        : { ...KOSONG }
    )
    setOpen(true)
  }

  const simpanForm = async () => {
    const errs = {}
    if (!form.nama_lengkap.trim()) errs.nama = true
    if (!edit && form.username.trim().length < 3) errs.username = true
    if (!edit && form.password.length < 6) errs.password = true
    if (edit && form.password && form.password.length < 6) errs.password = true
    setSalah(errs)
    if (Object.keys(errs).length) return

    setSimpan(true)
    try {
      const payload = {
        nama_lengkap: form.nama_lengkap.trim(),
        username: form.username.trim(),
        role: form.role,
        email: form.email.trim() || null,
      }
      if (form.password) payload.password = form.password
      if (edit) await Api.updatePengguna(edit.id_user, payload)
      else await Api.createPengguna(payload)
      setOpen(false)
      toast(edit ? 'Pengguna diperbarui.' : 'Pengguna ditambahkan.')
      muat()
    } catch (e) {
      toast(pesanError(e), 'err')
    } finally {
      setSimpan(false)
    }
  }

  const hapus = async (u) => {
    const ok = await confirm({
      title: 'Hapus pengguna?',
      message: `${u.nama_lengkap} (${u.username}) akan dihapus permanen.`,
      yes: 'Hapus pengguna',
    })
    if (!ok) return
    try {
      await Api.deletePengguna(u.id_user)
      toast('Pengguna dihapus.')
      muat()
    } catch (e) {
      toast(pesanError(e), 'err')
    }
  }

  return (
    <>
      <div className="between mb-16">
        <div className="page-head mb-0">
          <h1>Data pengguna</h1>
          <p>Kelola akun admin dan peserta ujian.</p>
        </div>
        <button className="btn btn-primary" onClick={() => bukaForm(null)}>
          <Icon name="plus" size={16} /> Tambah pengguna
        </button>
      </div>

      <div
        className="stat-grid mb-24"
        style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}
      >
        <div className="stat">
          <div className="stat-label">Total akun</div>
          <div className="stat-value" style={{ fontSize: 26 }}>
            {stat.total}
          </div>
        </div>
        <div className="stat accent-green">
          <div className="stat-label">Peserta</div>
          <div className="stat-value" style={{ fontSize: 26 }}>
            {stat.peserta}
          </div>
        </div>
        <div className="stat accent-amber">
          <div className="stat-label">Admin</div>
          <div className="stat-value" style={{ fontSize: 26 }}>
            {stat.admin}
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="field grow">
          <label htmlFor="fCari">Cari nama / username</label>
          <input
            className="input"
            id="fCari"
            placeholder="Kata kunci…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="fRole">Peran</label>
          <select className="select" id="fRole" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Semua</option>
            <option value="Peserta">Peserta</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <button
          className="btn"
          onClick={() => {
            setCari('')
            setRole('')
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
                <th>Nama</th>
                <th>Username</th>
                <th>Email</th>
                <th>Peran</th>
                <th>Aktivitas</th>
                <th className="right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {memuat && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">Memuat data…</div>
                  </td>
                </tr>
              )}
              {!memuat && data.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">Tidak ada pengguna yang cocok dengan filter.</div>
                  </td>
                </tr>
              )}
              {!memuat &&
                data.map((u, i) => (
                  <tr key={u.id_user}>
                    <td className="num muted">{i + 1}</td>
                    <td>
                      <div className="strong">{u.nama_lengkap}</div>
                    </td>
                    <td className="small mono">{u.username}</td>
                    <td className="small muted">{u.email || '—'}</td>
                    <td>
                      <span className={`badge ${u.role === 'Admin' ? 'badge-amber' : 'badge-blue'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="small muted">{tanggal(u.created_at)}</td>
                    <td>
                      <div className="actions">
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
        {data.length} dari {rows.length} akun ditampilkan.
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={edit ? 'Edit pengguna' : 'Tambah pengguna'}
        subtitle={
          edit ? `Akun ${edit.username}` : 'Akun baru langsung dapat digunakan untuk login.'
        }
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
          <div className={`field${salah.nama ? ' has-error' : ''}`}>
            <label htmlFor="nama">Nama lengkap</label>
            <input
              className="input"
              id="nama"
              placeholder="cth. Achmaddany Rozaqy"
              value={form.nama_lengkap}
              onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
              required
            />
            <div className="form-error">Nama wajib diisi.</div>
          </div>

          <div className={`field${salah.username ? ' has-error' : ''}`}>
            <label htmlFor="username">Username</label>
            <input
              className="input"
              id="username"
              placeholder="tanpa spasi"
              autoComplete="off"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              disabled={!!edit}
              required
            />
            <div className="form-error">Username minimal 3 karakter.</div>
          </div>

          <div className={`field${salah.password ? ' has-error' : ''}`}>
            <label htmlFor="pass">Password</label>
            <input
              className="input"
              id="pass"
              type="password"
              autoComplete="new-password"
              placeholder="minimal 6 karakter"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <span className="hint">Kosongkan saat edit bila tidak ingin mengubah password.</span>
            <div className="form-error">Password minimal 6 karakter.</div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="role">Peran</label>
              <select
                className="select"
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="Peserta">Peserta</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="email">
                Email <span className="muted">(opsional)</span>
              </label>
              <input
                className="input"
                id="email"
                type="email"
                placeholder="nama@unp.ac.id"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}
