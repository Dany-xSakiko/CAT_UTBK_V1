import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../../lib/icons'
import Api, { pesanError } from '../../lib/api'
import { Modal, Tombol, useToast, useConfirm } from '../../components/ui'

const HURUF = ['A', 'B', 'C', 'D', 'E']

const KOSONG = {
  nomor_urut: '',
  teks_soal: '',
  opsi_a: '',
  opsi_b: '',
  opsi_c: '',
  opsi_d: '',
  opsi_e: '',
  kunci_jawaban: 'A',
}

export default function AdminSoal() {
  const toast = useToast()
  const confirm = useConfirm()
  const [params, setParams] = useSearchParams()

  const [ujian, setUjian] = useState([])
  const [idUjian, setIdUjian] = useState(params.get('ujian') || '')
  const [rows, setRows] = useState([])
  const [memuat, setMemuat] = useState(false)
  const [cari, setCari] = useState('')

  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState(KOSONG)
  const [salah, setSalah] = useState({})
  const [simpan, setSimpan] = useState(false)

  useEffect(() => {
    Api.listUjian()
      .then((r) => {
        const list = r.data || []
        setUjian(list)
        if (!idUjian && list.length) {
          const berisi = list.find((u) => Number(u.jumlah_soal) > 0)
          setIdUjian(String((berisi || list[0]).id_ujian))
        }
      })
      .catch((e) => toast(pesanError(e), 'err'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const muatSoal = async (id) => {
    if (!id) {
      setRows([])
      return
    }
    setMemuat(true)
    try {
      const res = await Api.detailUjian(id)
      setRows(res.data?.soal || [])
    } catch (e) {
      toast(pesanError(e), 'err')
      setRows([])
    } finally {
      setMemuat(false)
    }
  }

  useEffect(() => {
    muatSoal(idUjian)
    if (idUjian) setParams({ ujian: idUjian }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUjian])

  const aktif = useMemo(
    () => ujian.find((u) => String(u.id_ujian) === String(idUjian)),
    [ujian, idUjian]
  )

  const data = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return q ? rows.filter((s) => s.teks_soal?.toLowerCase().includes(q)) : rows
  }, [rows, cari])

  const bukaForm = (s) => {
    setEdit(s || null)
    setSalah({})
    setForm(
      s
        ? {
            nomor_urut: s.nomor_urut,
            teks_soal: s.teks_soal,
            opsi_a: s.opsi?.A || '',
            opsi_b: s.opsi?.B || '',
            opsi_c: s.opsi?.C || '',
            opsi_d: s.opsi?.D || '',
            opsi_e: s.opsi?.E || '',
            kunci_jawaban: s.kunci_jawaban || 'A',
          }
        : { ...KOSONG }
    )
    setOpen(true)
  }

  const simpanForm = async () => {
    const errs = {}
    if (!form.teks_soal.trim()) errs.teks = true
    if (!form.opsi_a.trim() || !form.opsi_b.trim() || !form.opsi_c.trim() || !form.opsi_d.trim()) {
      errs.opsi = true
    }
    setSalah(errs)
    if (Object.keys(errs).length) return

    setSimpan(true)
    try {
      const payload = {
        id_ujian: Number(idUjian),
        nomor_urut: form.nomor_urut ? Number(form.nomor_urut) : undefined,
        teks_soal: form.teks_soal.trim(),
        opsi_a: form.opsi_a.trim(),
        opsi_b: form.opsi_b.trim(),
        opsi_c: form.opsi_c.trim(),
        opsi_d: form.opsi_d.trim(),
        opsi_e: form.opsi_e.trim(),
        kunci_jawaban: form.kunci_jawaban,
      }
      if (edit) await Api.updateSoal(edit.id_soal, payload)
      else await Api.createSoal(payload)
      setOpen(false)
      toast(edit ? 'Soal diperbarui.' : 'Soal ditambahkan.')
      muatSoal(idUjian)
    } catch (e) {
      toast(pesanError(e), 'err')
    } finally {
      setSimpan(false)
    }
  }

  const hapus = async (s) => {
    const ok = await confirm({
      title: 'Hapus soal?',
      message: `Soal nomor ${s.nomor_urut} akan dihapus permanen.`,
      yes: 'Hapus soal',
    })
    if (!ok) return
    try {
      await Api.deleteSoal(s.id_soal)
      toast('Soal dihapus.')
      muatSoal(idUjian)
    } catch (e) {
      toast(pesanError(e), 'err')
    }
  }

  return (
    <>
      <div className="between mb-16">
        <div className="page-head mb-0">
          <h1>Bank soal</h1>
          <p>Kelola butir soal pilihan ganda untuk setiap ujian.</p>
        </div>
        <button className="btn btn-primary" onClick={() => bukaForm(null)} disabled={!idUjian}>
          <Icon name="plus" size={16} /> Tambah soal
        </button>
      </div>

      <div className="filter-bar">
        <div className="field grow">
          <label htmlFor="fUjian">Ujian</label>
          <select
            className="select"
            id="fUjian"
            value={idUjian}
            onChange={(e) => setIdUjian(e.target.value)}
          >
            {ujian.length === 0 && <option value="">Belum ada ujian</option>}
            {ujian.map((u) => (
              <option key={u.id_ujian} value={u.id_ujian}>
                {u.judul_mata_kuliah}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="fCari">Cari teks soal</label>
          <input
            className="input"
            id="fCari"
            placeholder="Kata kunci…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </div>
      </div>

      {aktif && (
        <div className="alert alert-info mb-16">
          <span className="alert-ico">
            <Icon name="book" size={18} />
          </span>
          <div>
            <b>{aktif.judul_mata_kuliah}</b>
            {rows.length} soal · durasi {aktif.durasi_menit} menit ·{' '}
            {aktif.status_aktif ? 'status aktif' : 'status nonaktif'}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h3>Daftar soal</h3>
          <span className="small muted">
            {data.length} soal{aktif ? ` · ${aktif.judul_mata_kuliah}` : ''}
          </span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 56 }}>No</th>
                <th>Soal</th>
                <th>Opsi</th>
                <th style={{ width: 80 }} className="center">
                  Kunci
                </th>
                <th className="right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {memuat && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">Memuat soal…</div>
                  </td>
                </tr>
              )}
              {!memuat && data.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      {idUjian
                        ? 'Belum ada soal untuk ujian ini. Tambahkan soal pertama.'
                        : 'Pilih ujian terlebih dahulu.'}
                    </div>
                  </td>
                </tr>
              )}
              {!memuat &&
                data.map((s) => (
                  <tr key={s.id_soal}>
                    <td className="num muted">{s.nomor_urut}</td>
                    <td>
                      <div className="strong small">{s.teks_soal}</div>
                    </td>
                    <td className="tiny muted">
                      {HURUF.filter((h) => s.opsi?.[h])
                        .map((h) => `${h}. ${s.opsi[h]}`)
                        .join(' · ')}
                    </td>
                    <td className="center">
                      <span className="badge badge-green">{s.kunci_jawaban}</span>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-sm btn-ghost" onClick={() => bukaForm(s)} title="Edit">
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => hapus(s)}
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        wide
        title={edit ? 'Edit soal' : 'Tambah soal'}
        subtitle={aktif ? `${aktif.judul_mata_kuliah} · soal nomor ${edit?.nomor_urut ?? 'baru'}` : '—'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>
              Batal
            </button>
            <Tombol loading={simpan} onClick={simpanForm} className="btn btn-primary">
              Simpan soal
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
          <div className="form-row">
            <div className="field">
              <label htmlFor="nomor">Nomor urut</label>
              <input
                className="input"
                id="nomor"
                type="number"
                min="1"
                placeholder="otomatis"
                value={form.nomor_urut}
                onChange={(e) => setForm({ ...form, nomor_urut: e.target.value })}
              />
              <span className="hint">Kosongkan untuk otomatis di akhir.</span>
            </div>
            <div className="field">
              <label htmlFor="kunci">Kunci jawaban</label>
              <select
                className="select"
                id="kunci"
                value={form.kunci_jawaban}
                onChange={(e) => setForm({ ...form, kunci_jawaban: e.target.value })}
              >
                {HURUF.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={`field${salah.teks ? ' has-error' : ''}`}>
            <label htmlFor="teks">Pertanyaan</label>
            <textarea
              className="textarea"
              id="teks"
              rows={4}
              placeholder="Tulis pertanyaan di sini…"
              value={form.teks_soal}
              onChange={(e) => setForm({ ...form, teks_soal: e.target.value })}
              required
            />
            <div className="form-error">Pertanyaan wajib diisi.</div>
          </div>

          <div className={`field${salah.opsi ? ' has-error' : ''}`}>
            <label>Pilihan jawaban</label>
            <div className="stack gap-8">
              {HURUF.map((h) => (
                <div className="flex items-center gap-8" key={h}>
                  <b style={{ width: 18 }}>{h}</b>
                  <input
                    className="input"
                    id={`opsi_${h.toLowerCase()}`}
                    placeholder={`Opsi ${h}${h === 'E' ? ' (opsional)' : ''}`}
                    value={form[`opsi_${h.toLowerCase()}`]}
                    onChange={(e) => setForm({ ...form, [`opsi_${h.toLowerCase()}`]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="form-error">Minimal opsi A–D harus diisi.</div>
          </div>
        </form>
      </Modal>
    </>
  )
}
