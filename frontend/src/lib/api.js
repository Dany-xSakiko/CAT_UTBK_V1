import axios from 'axios'

const TOKEN_KEY = 'cat_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  headers: { Accept: 'application/json' },
  timeout: 20000,
})

http.interceptors.request.use((cfg) => {
  const t = tokenStore.get()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

// 401 → sesi mati, lempar ke login (kecuali request login itu sendiri)
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const url = err.config?.url || ''
    if (status === 401 && !url.includes('/login')) {
      tokenStore.clear()
      localStorage.removeItem('cat_user')
      if (!location.pathname.startsWith('/login')) location.replace('/login?expired=1')
    }
    return Promise.reject(err)
  }
)

/** Ambil pesan error yang layak ditampilkan dari response Laravel. */
export function pesanError(err, fallback = 'Terjadi kesalahan. Coba lagi.') {
  const d = err?.response?.data
  if (!d) return err?.message?.includes('Network') ? 'Tidak bisa menghubungi server. Pastikan backend jalan.' : fallback
  if (typeof d === 'string') return d
  if (d.errors && typeof d.errors === 'object') {
    const first = Object.values(d.errors)[0]
    return Array.isArray(first) ? first[0] : String(first)
  }
  return d.message || fallback
}

const d = (res) => res.data

export const Api = {
  // ---------- auth ----------
  login: (payload) => http.post('/login', payload).then(d),
  me: () => http.get('/me').then(d),
  logout: () => http.post('/logout').then(d),

  // ---------- ujian ----------
  listUjian: () => http.get('/ujian').then(d),
  detailUjian: (id) => http.get(`/ujian/${id}`).then(d),
  createUjian: (payload) => http.post('/ujian', payload).then(d),
  updateUjian: (id, payload) => http.put(`/ujian/${id}`, payload).then(d),
  deleteUjian: (id) => http.delete(`/ujian/${id}`).then(d),
  mulaiUjian: (id) => http.post(`/ujian/${id}/mulai`).then(d),

  // ---------- soal ----------
  listSoal: (ujianId) => http.get('/soal', { params: { ujian_id: ujianId } }).then(d),
  createSoal: (payload) => http.post('/soal', payload).then(d),
  updateSoal: (id, payload) => http.put(`/soal/${id}`, payload).then(d),
  deleteSoal: (id) => http.delete(`/soal/${id}`).then(d),

  // ---------- pengguna ----------
  listPengguna: (params) => http.get('/pengguna', { params }).then(d),
  createPengguna: (payload) => http.post('/pengguna', payload).then(d),
  updatePengguna: (id, payload) => http.put(`/pengguna/${id}`, payload).then(d),
  deletePengguna: (id) => http.delete(`/pengguna/${id}`).then(d),

  // ---------- pengerjaan ----------
  getRekam: (id) => http.get(`/rekam/${id}`).then(d),
  jawab: (rekamId, payload) => http.post(`/rekam/${rekamId}/jawab`, payload).then(d),
  selesai: (rekamId) => http.post(`/rekam/${rekamId}/selesai`).then(d),

  // ---------- proctoring ----------
  kirimLog: (payload) => http.post('/proctoring/log', payload).then(d),
  logRekam: (rekamId) => http.get(`/proctoring/logs/${rekamId}`).then(d),

  // ---------- statistik & laporan ----------
  ringkasan: () => http.get('/admin/statistik/ringkasan').then(d),
  distribusi: () => http.get('/admin/statistik/distribusi').then(d),
  statistikPeserta: () => http.get('/admin/statistik/peserta').then(d),
  laporanProctoring: () => http.get('/admin/laporan/proctoring/eloquent').then(d),
}

export default Api
