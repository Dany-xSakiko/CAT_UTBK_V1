import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../../lib/icons'
import Api, { pesanError } from '../../lib/api'
import { Modal, Tombol, useToast, useConfirm } from '../../components/ui'

const HURUF = ['A', 'B', 'C', 'D', 'E']
const MAKS_SOAL = 100

const buatButirKosong = () => ({
  nomor_urut: '',
  teks_soal: '',
  opsi_a: '',
  opsi_b: '',
  opsi_c: '',
  opsi_d: '',
  opsi_e: '',
  kunci_jawaban: 'A',
  gambar_file: null,
  gambar_preview: '',
  hapus_gambar: false,
})

export default function AdminSoal() {
  const toast = useToast()
  const confirm = useConfirm()
  const [params, setParams] = useSearchParams()

  const [ujian, setUjian] = useState([])
  const [idUjian, setIdUjian] = useState(params.get('ujian') || '')
  const [rows, setRows] = useState([])
  const [memuat, setMemuat] = useState(false)
  const [cari, setCari] = useState('')
  const [zoomGambar, setZoomGambar] = useState(null)

  // modal edit / tambah 1 soal
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState(buatButirKosong)
  const [salah, setSalah] = useState({})
  const [simpan, setSimpan] = useState(false)

  // modal custom tambah banyak soal sekaligus (hingga total 100 soal)
  const [openBanyak, setOpenBanyak] = useState(false)
  const [jumlahCustom, setJumlahCustom] = useState(5)
  const [daftarBaru, setDaftarBaru] = useState(() => [buatButirKosong()])
  const [salahBanyak, setSalahBanyak] = useState({})
  const [simpanBanyak, setSimpanBanyak] = useState(false)

  // modal ambil dari Bank Soal (salin soal & gambar dari ujian lain di Bank Soal)
  const [openBank, setOpenBank] = useState(false)
  const [bankRows, setBankRows] = useState([])
  const [memuatBank, setMemuatBank] = useState(false)
  const [filterUjianAsal, setFilterUjianAsal] = useState('')
  const [hanyaBergambar, setHanyaBergambar] = useState(false)
  const [cariBank, setCariBank] = useState('')
  const [pilihBank, setPilihBank] = useState(() => new Set())
  const [simpanBank, setSimpanBank] = useState(false)

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
      const list = res.data?.soal || []
      setRows(list)
      setUjian((prev) =>
        prev.map((u) => (String(u.id_ujian) === String(id) ? { ...u, jumlah_soal: list.length } : u))
      )
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

  const sisaSlot = Math.max(0, MAKS_SOAL - rows.length)
  const penuh = sisaSlot <= 0

  const data = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return q ? rows.filter((s) => s.teks_soal?.toLowerCase().includes(q)) : rows
  }, [rows, cari])

  const bukaForm = (s) => {
    if (!s && penuh) {
      toast(`Jumlah soal sudah mencapai batas maksimal ${MAKS_SOAL} soal.`, 'err')
      return
    }
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
            gambar_file: null,
            gambar_preview: s.gambar_url || '',
            hapus_gambar: false,
          }
        : buatButirKosong()
    )
    setOpen(true)
  }

  const pilihGambarSatuan = (file) => {
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      toast('Ukuran gambar maksimal 4 MB.', 'err')
      return
    }
    const url = URL.createObjectURL(file)
    setForm((f) => ({
      ...f,
      gambar_file: file,
      gambar_preview: url,
      hapus_gambar: false,
    }))
  }

  const hapusGambarSatuan = () => {
    setForm((f) => ({
      ...f,
      gambar_file: null,
      gambar_preview: '',
      hapus_gambar: true,
    }))
  }

  const simpanForm = async (lanjutTambah = false) => {
    const errs = {}
    if (!form.teks_soal.trim()) errs.teks = true
    if (!form.opsi_a.trim() || !form.opsi_b.trim() || !form.opsi_c.trim() || !form.opsi_d.trim()) {
      errs.opsi = true
    }
    setSalah(errs)
    if (Object.keys(errs).length) return

    setSimpan(true)
    try {
      const fd = new FormData()
      fd.append('id_ujian', String(Number(idUjian)))
      if (form.nomor_urut) fd.append('nomor_urut', String(Number(form.nomor_urut)))
      fd.append('teks_soal', form.teks_soal.trim())
      fd.append('opsi_a', form.opsi_a.trim())
      fd.append('opsi_b', form.opsi_b.trim())
      fd.append('opsi_c', form.opsi_c.trim())
      fd.append('opsi_d', form.opsi_d.trim())
      fd.append('opsi_e', form.opsi_e.trim())
      fd.append('kunci_jawaban', form.kunci_jawaban)

      if (form.gambar_file) {
        fd.append('gambar_soal', form.gambar_file)
      } else if (form.hapus_gambar) {
        fd.append('hapus_gambar', '1')
      }

      if (edit) await Api.updateSoal(edit.id_soal, fd)
      else await Api.createSoal(fd)

      toast(edit ? 'Soal diperbarui.' : 'Soal ditambahkan.')
      await muatSoal(idUjian)

      if (lanjutTambah && !edit && rows.length + 1 < MAKS_SOAL) {
        setForm(buatButirKosong())
        setSalah({})
      } else {
        setOpen(false)
      }
    } catch (e) {
      toast(pesanError(e), 'err')
    } finally {
      setSimpan(false)
    }
  }

  /* ------------------------------------------------ tambah banyak soal */
  const aturJumlahBaris = (n) => {
    const target = Math.max(1, Math.min(sisaSlot || 1, Number(n) || 1))
    setJumlahCustom(target)
    setDaftarBaru((prev) => {
      if (prev.length === target) return prev
      if (prev.length > target) return prev.slice(0, target)
      return [...prev, ...Array.from({ length: target - prev.length }, buatButirKosong)]
    })
  }

  const bukaModalBanyak = () => {
    if (penuh) {
      toast(`Jumlah soal sudah mencapai batas maksimal ${MAKS_SOAL} soal.`, 'err')
      return
    }
    const awal = Math.min(5, sisaSlot)
    setJumlahCustom(awal)
    setDaftarBaru(Array.from({ length: awal }, buatButirKosong))
    setSalahBanyak({})
    setOpenBanyak(true)
  }

  const ubahButir = (idx, field, val) => {
    setDaftarBaru((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it)))
  }

  const pilihGambarButir = (idx, file) => {
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      toast('Ukuran gambar maksimal 4 MB.', 'err')
      return
    }
    const url = URL.createObjectURL(file)
    setDaftarBaru((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, gambar_file: file, gambar_preview: url } : it))
    )
  }

  const hapusGambarButir = (idx) => {
    setDaftarBaru((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, gambar_file: null, gambar_preview: '' } : it))
    )
  }

  const hapusBarisButir = (idx) => {
    setDaftarBaru((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      setJumlahCustom(next.length)
      return next
    })
  }

  const simpanBanyakSoal = async () => {
    const errs = {}
    daftarBaru.forEach((b, i) => {
      if (!b.teks_soal.trim() || !b.opsi_a.trim() || !b.opsi_b.trim() || !b.opsi_c.trim() || !b.opsi_d.trim()) {
        errs[i] = true
      }
    })
    setSalahBanyak(errs)
    if (Object.keys(errs).length) {
      toast('Lengkapi pertanyaan dan minimal opsi A–D pada setiap butir soal.', 'err')
      return
    }

    setSimpanBanyak(true)
    try {
      const fd = new FormData()
      fd.append('id_ujian', String(Number(idUjian)))
      daftarBaru.forEach((b, i) => {
        if (b.nomor_urut) fd.append(`soal[${i}][nomor_urut]`, String(Number(b.nomor_urut)))
        fd.append(`soal[${i}][teks_soal]`, b.teks_soal.trim())
        fd.append(`soal[${i}][opsi_a]`, b.opsi_a.trim())
        fd.append(`soal[${i}][opsi_b]`, b.opsi_b.trim())
        fd.append(`soal[${i}][opsi_c]`, b.opsi_c.trim())
        fd.append(`soal[${i}][opsi_d]`, b.opsi_d.trim())
        fd.append(`soal[${i}][opsi_e]`, b.opsi_e.trim())
        fd.append(`soal[${i}][kunci_jawaban]`, b.kunci_jawaban)
        if (b.gambar_file) {
          fd.append(`soal[${i}][gambar_soal]`, b.gambar_file)
        }
      })

      await Api.createSoalBatch(fd)
      setOpenBanyak(false)
      toast(`${daftarBaru.length} soal berhasil ditambahkan.`)
      muatSoal(idUjian)
    } catch (e) {
      toast(pesanError(e), 'err')
    } finally {
      setSimpanBanyak(false)
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

  /* ------------------------------------------------ ambil dari Bank Soal */
  const bukaModalBank = async () => {
    if (penuh) {
      toast(`Jumlah soal sudah mencapai batas maksimal ${MAKS_SOAL} soal.`, 'err')
      return
    }
    setOpenBank(true)
    setPilihBank(new Set())
    setFilterUjianAsal('')
    setCariBank('')
    setMemuatBank(true)
    try {
      const res = await Api.bankSoal({ exclude_ujian: idUjian })
      setBankRows(res.data || [])
    } catch (e) {
      toast(pesanError(e), 'err')
    } finally {
      setMemuatBank(false)
    }
  }

  const bankTersaring = useMemo(() => {
    const q = cariBank.trim().toLowerCase()
    return bankRows.filter((s) => {
      if (filterUjianAsal && String(s.id_ujian) !== String(filterUjianAsal)) return false
      if (hanyaBergambar && !s.gambar_url) return false
      if (q && !s.teks_soal?.toLowerCase().includes(q)) return false
      return true
    })
  }, [bankRows, filterUjianAsal, hanyaBergambar, cariBank])

  const togglePilihSoalBank = (idSoal) => {
    setPilihBank((prev) => {
      const next = new Set(prev)
      if (next.has(idSoal)) next.delete(idSoal)
      else if (next.size < sisaSlot) next.add(idSoal)
      else toast(`Maksimal dapat memilih ${sisaSlot} soal lagi sesuai sisa kuota.`, 'err')
      return next
    })
  }

  const pilihSemuaBankTersaring = () => {
    setPilihBank((prev) => {
      const next = new Set(prev)
      for (const s of bankTersaring) {
        if (next.size >= sisaSlot) break
        next.add(s.id_soal)
      }
      return next
    })
  }

  const simpanDariBank = async () => {
    if (pilihBank.size === 0) {
      toast('Pilih minimal 1 soal dari Bank Soal.', 'err')
      return
    }
    setSimpanBank(true)
    try {
      await Api.salinSoal({
        id_ujian: Number(idUjian),
        id_soal: [...pilihBank],
      })
      setOpenBank(false)
      toast(`${pilihBank.size} soal berhasil diambil dari Bank Soal.`)
      muatSoal(idUjian)
    } catch (e) {
      toast(pesanError(e), 'err')
    } finally {
      setSimpanBank(false)
    }
  }

  return (
    <>
      <div className="between mb-16">
        <div className="page-head mb-0">
          <h1>Bank soal</h1>
          <p>Kelola butir soal pilihan ganda & lampiran gambar (maksimal {MAKS_SOAL} soal per ujian).</p>
        </div>
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <button
            className="btn"
            onClick={bukaModalBank}
            disabled={!idUjian || penuh}
            title={penuh ? `Sudah mencapai batas ${MAKS_SOAL} soal` : 'Ambil soal beserta gambarnya dari Bank Soal'}
          >
            <Icon name="book" size={16} /> Ambil dari Bank Soal
          </button>
          <button
            className="btn"
            onClick={bukaModalBanyak}
            disabled={!idUjian || penuh}
            title={penuh ? `Sudah mencapai batas ${MAKS_SOAL} soal` : 'Tambah beberapa soal sekaligus'}
          >
            <Icon name="plus" size={16} /> Tambah banyak soal
          </button>
          <button
            className="btn btn-primary"
            onClick={() => bukaForm(null)}
            disabled={!idUjian || penuh}
            title={penuh ? `Sudah mencapai batas ${MAKS_SOAL} soal` : 'Tambah 1 soal'}
          >
            <Icon name="plus" size={16} /> Tambah soal
          </button>
        </div>
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
                {u.judul_mata_kuliah} ({u.jumlah_soal ?? 0}/{MAKS_SOAL} soal)
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
        <div className={`alert ${penuh ? 'alert-warn' : 'alert-info'} mb-16`}>
          <span className="alert-ico">
            <Icon name="book" size={18} />
          </span>
          <div style={{ flex: 1 }}>
            <div className="between">
              <b>{aktif.judul_mata_kuliah}</b>
              <span className="small strong">
                {rows.length} / {MAKS_SOAL} soal ({sisaSlot} slot tersisa)
              </span>
            </div>
            <div>
              Durasi {aktif.durasi_menit} menit · {aktif.status_aktif ? 'status aktif' : 'status nonaktif'} ·{' '}
              {aktif.acak_soal !== false ? 'urutan soal diacak per peserta' : 'urutan soal tetap'}
              {penuh && ' · Kuota maksimal 100 soal sudah terpenuhi.'}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h3>Daftar soal</h3>
          <span className="small muted">
            {data.length} dari {rows.length} soal (maks. {MAKS_SOAL})
            {aktif ? ` · ${aktif.judul_mata_kuliah}` : ''}
          </span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 56 }}>No</th>
                <th>Soal</th>
                <th style={{ width: 96 }} className="center">
                  Gambar
                </th>
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
                  <td colSpan={6}>
                    <div className="empty-state">Memuat soal…</div>
                  </td>
                </tr>
              )}
              {!memuat && data.length === 0 && (
                <tr>
                  <td colSpan={6}>
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
                    <td className="center">
                      {s.gambar_url ? (
                        <button
                          type="button"
                          onClick={() => setZoomGambar(s)}
                          style={{
                            border: '1px solid var(--line)',
                            background: '#fff',
                            padding: 2,
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                          title="Klik untuk memperbesar gambar soal"
                        >
                          <img
                            src={s.gambar_url}
                            alt={`Soal ${s.nomor_urut}`}
                            style={{ width: 52, height: 38, objectFit: 'cover', borderRadius: 4, display: 'block' }}
                          />
                        </button>
                      ) : (
                        <span className="tiny muted">—</span>
                      )}
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

      {/* ---------------------------- modal preview gambar ---------------------------- */}
      <Modal
        open={!!zoomGambar}
        onClose={() => setZoomGambar(null)}
        title={`Gambar soal #${zoomGambar?.nomor_urut ?? ''}`}
        subtitle={zoomGambar?.teks_soal}
        footer={
          <button className="btn" onClick={() => setZoomGambar(null)}>
            Tutup
          </button>
        }
      >
        {zoomGambar?.gambar_url && (
          <div style={{ textAlign: 'center' }}>
            <img
              src={zoomGambar.gambar_url}
              alt="Gambar soal"
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 10 }}
            />
          </div>
        )}
      </Modal>

      {/* ---------------------------- modal 1 soal ---------------------------- */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        wide
        title={edit ? 'Edit soal' : 'Tambah soal'}
        subtitle={
          aktif
            ? `${aktif.judul_mata_kuliah} · ${edit ? `soal nomor ${edit.nomor_urut}` : `terisi ${rows.length}/${MAKS_SOAL} soal`}`
            : '—'
        }
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>
              Batal
            </button>
            {!edit && rows.length + 1 < MAKS_SOAL && (
              <Tombol loading={simpan} onClick={() => simpanForm(true)} className="btn">
                Simpan & tambah lagi
              </Tombol>
            )}
            <Tombol loading={simpan} onClick={() => simpanForm(false)} className="btn btn-primary">
              Simpan soal
            </Tombol>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            simpanForm(false)
          }}
          noValidate
        >
          <div className="form-row">
            <div className="field">
              <label htmlFor="nomor">Nomor urut (1–{MAKS_SOAL})</label>
              <input
                className="input"
                id="nomor"
                type="number"
                min="1"
                max={MAKS_SOAL}
                placeholder="otomatis"
                value={form.nomor_urut}
                onChange={(e) => setForm({ ...form, nomor_urut: e.target.value })}
              />
              <span className="hint">Kosongkan untuk mengisi nomor berikutnya secara otomatis.</span>
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

          <div className="field">
            <label htmlFor="gambarSoal">Gambar pendukung soal (opsional)</label>
            <div className="flex items-center gap-8" style={{ flexWrap: 'wrap' }}>
              <input
                className="input"
                id="gambarSoal"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => pilihGambarSatuan(e.target.files?.[0] || null)}
                style={{ maxWidth: 320 }}
              />
              {form.gambar_preview && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ color: 'var(--red-600)' }}
                  onClick={hapusGambarSatuan}
                >
                  <Icon name="trash" size={14} /> Hapus gambar
                </button>
              )}
            </div>
            <span className="hint">Format JPG, PNG, WEBP, atau GIF · maksimal 4 MB.</span>
            {form.gambar_preview && (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  background: '#f8fafc',
                  textAlign: 'center',
                }}
              >
                <img
                  src={form.gambar_preview}
                  alt="Preview gambar soal"
                  style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8 }}
                />
              </div>
            )}
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

      {/* ---------------------------- modal custom tambah banyak soal ---------------------------- */}
      <Modal
        open={openBanyak}
        onClose={() => setOpenBanyak(false)}
        wide
        title="Tambah banyak soal sekaligus"
        subtitle={
          aktif
            ? `${aktif.judul_mata_kuliah} · Tersedia ${sisaSlot} slot lagi (maksimal ${MAKS_SOAL} soal)`
            : '—'
        }
        footer={
          <>
            <button className="btn" onClick={() => setOpenBanyak(false)}>
              Batal
            </button>
            <Tombol loading={simpanBanyak} onClick={simpanBanyakSoal} className="btn btn-primary">
              Simpan {daftarBaru.length} soal
            </Tombol>
          </>
        }
      >
        <div className="between mb-16" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div className="flex items-center gap-8">
            <label htmlFor="jmlSoal" className="small strong">
              Jumlah soal yang ingin ditambahkan:
            </label>
            <input
              id="jmlSoal"
              type="number"
              className="input"
              style={{ width: 96 }}
              min={1}
              max={sisaSlot || 1}
              value={jumlahCustom}
              onChange={(e) => aturJumlahBaris(e.target.value)}
            />
            <span className="small muted">(maks. {sisaSlot})</span>
          </div>
          <div className="flex gap-8">
            {[5, 10, 25, 50, 100]
              .filter((n) => n <= sisaSlot)
              .map((n) => (
                <button key={n} type="button" className="btn btn-sm" onClick={() => aturJumlahBaris(n)}>
                  +{n} soal
                </button>
              ))}
          </div>
        </div>

        <div className="stack gap-16" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
          {daftarBaru.map((b, i) => (
            <div
              key={i}
              className="card card-pad"
              style={{
                borderColor: salahBanyak[i] ? 'var(--red-600)' : undefined,
                background: 'var(--bg-subtle, #f8fafc)',
              }}
            >
              <div className="between mb-8">
                <b>Soal baru #{i + 1}</b>
                <div className="flex items-center gap-8">
                  <span className="small muted">Kunci:</span>
                  <select
                    className="select"
                    style={{ width: 72 }}
                    value={b.kunci_jawaban}
                    onChange={(e) => ubahButir(i, 'kunci_jawaban', e.target.value)}
                  >
                    {HURUF.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  {daftarBaru.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      style={{ color: 'var(--red-600)' }}
                      onClick={() => hapusBarisButir(i)}
                      title="Hapus butir ini"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="field">
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder={`Tulis pertanyaan soal #${i + 1}…`}
                  value={b.teks_soal}
                  onChange={(e) => ubahButir(i, 'teks_soal', e.target.value)}
                />
              </div>

              <div className="field">
                <div className="flex items-center gap-8" style={{ flexWrap: 'wrap' }}>
                  <input
                    className="input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => pilihGambarButir(i, e.target.files?.[0] || null)}
                    style={{ maxWidth: 280 }}
                  />
                  {b.gambar_preview && (
                    <>
                      <img
                        src={b.gambar_preview}
                        alt="Preview"
                        style={{ height: 42, borderRadius: 6, border: '1px solid var(--line)' }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        style={{ color: 'var(--red-600)' }}
                        onClick={() => hapusGambarButir(i)}
                      >
                        Hapus gambar
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="stack gap-8">
                {HURUF.map((h) => (
                  <div className="flex items-center gap-8" key={h}>
                    <b style={{ width: 18 }}>{h}</b>
                    <input
                      className="input"
                      placeholder={`Opsi ${h}${h === 'E' ? ' (opsional)' : ''}`}
                      value={b[`opsi_${h.toLowerCase()}`]}
                      onChange={(e) => ubahButir(i, `opsi_${h.toLowerCase()}`, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
      {/* ---------------------------- modal ambil dari Bank Soal ---------------------------- */}
      <Modal
        open={openBank}
        onClose={() => setOpenBank(false)}
        wide
        title="Ambil Soal dari Bank Soal"
        subtitle={
          aktif
            ? `Salin ke "${aktif.judul_mata_kuliah}" · Dipilih ${pilihBank.size} soal (sisa slot ${sisaSlot})`
            : '—'
        }
        footer={
          <>
            <button className="btn" onClick={() => setOpenBank(false)}>
              Batal
            </button>
            <Tombol
              loading={simpanBank}
              onClick={simpanDariBank}
              disabled={pilihBank.size === 0}
              className="btn btn-primary"
            >
              Tambahkan {pilihBank.size} soal terpilih
            </Tombol>
          </>
        }
      >
        <div className="filter-bar mb-16" style={{ gap: 10 }}>
          <div className="field">
            <label htmlFor="fAsal">Dari ujian</label>
            <select
              id="fAsal"
              className="select"
              value={filterUjianAsal}
              onChange={(e) => setFilterUjianAsal(e.target.value)}
            >
              <option value="">Semua ujian di Bank Soal</option>
              {ujian
                .filter((u) => String(u.id_ujian) !== String(idUjian))
                .map((u) => (
                  <option key={u.id_ujian} value={u.id_ujian}>
                    {u.judul_mata_kuliah}
                  </option>
                ))}
            </select>
          </div>
          <div className="field grow">
            <label htmlFor="fCariBank">Cari pertanyaan</label>
            <input
              id="fCariBank"
              className="input"
              placeholder="Kata kunci soal…"
              value={cariBank}
              onChange={(e) => setCariBank(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-8 small" style={{ cursor: 'pointer', alignSelf: 'flex-end', paddingBottom: 10 }}>
            <input
              type="checkbox"
              checked={hanyaBergambar}
              onChange={(e) => setHanyaBergambar(e.target.checked)}
            />
            <span>Hanya yang bergambar</span>
          </label>
        </div>

        <div className="between mb-8">
          <span className="small muted">{bankTersaring.length} soal ditemukan di Bank Soal</span>
          <div className="flex gap-8">
            <button type="button" className="btn btn-sm" onClick={pilihSemuaBankTersaring} disabled={!bankTersaring.length}>
              Pilih semua ({Math.min(bankTersaring.length, sisaSlot)})
            </button>
            {pilihBank.size > 0 && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPilihBank(new Set())}>
                Bersihkan pilihan
              </button>
            )}
          </div>
        </div>

        <div className="table-wrap" style={{ maxHeight: '52vh', overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 42 }} />
                <th>Asal Ujian</th>
                <th>Pertanyaan</th>
                <th style={{ width: 84 }} className="center">
                  Gambar
                </th>
                <th style={{ width: 64 }} className="center">
                  Kunci
                </th>
              </tr>
            </thead>
            <tbody>
              {memuatBank && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">Memuat Bank Soal…</div>
                  </td>
                </tr>
              )}
              {!memuatBank && bankTersaring.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">Tidak ada soal yang cocok dengan filter.</div>
                  </td>
                </tr>
              )}
              {!memuatBank &&
                bankTersaring.map((s) => {
                  const centang = pilihBank.has(s.id_soal)
                  return (
                    <tr
                      key={s.id_soal}
                      onClick={() => togglePilihSoalBank(s.id_soal)}
                      style={{ cursor: 'pointer', background: centang ? 'var(--blue-50, #eff6ff)' : undefined }}
                    >
                      <td className="center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={centang}
                          onChange={() => togglePilihSoalBank(s.id_soal)}
                        />
                      </td>
                      <td className="tiny muted">{s.judul_mata_kuliah || `Ujian #${s.id_ujian}`}</td>
                      <td className="small strong">{s.teks_soal}</td>
                      <td className="center">
                        {s.gambar_url ? (
                          <img
                            src={s.gambar_url}
                            alt=""
                            style={{ width: 48, height: 34, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--line)' }}
                          />
                        ) : (
                          <span className="tiny muted">—</span>
                        )}
                      </td>
                      <td className="center">
                        <span className="badge badge-green">{s.kunci_jawaban}</span>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  )
}
