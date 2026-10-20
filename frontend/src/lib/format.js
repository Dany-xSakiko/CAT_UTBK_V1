const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/** parse '2026-10-15' / '2026-10-15 08:00:00' / ISO → Date | null */
function toDate(val) {
  if (!val) return null
  let s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T00:00:00'
  else if (/^\d{4}-\d{2}-\d{2} \d{2}/.test(s)) s = s.replace(' ', 'T')
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

/** '2026-10-15' → '15 Okt 2026' */
export function tanggal(val) {
  const d = toDate(val)
  if (!d) return val ? String(val) : '—'
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

/** '2026-10-15' → 'Kamis, 15 Oktober 2026' */
export function tanggalPanjang(val) {
  const d = toDate(val)
  if (!d) return val ? String(val) : '—'
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

/** '08:00:00' → '08:00' */
export function jam(val) {
  if (!val) return '—'
  const s = String(val)
  if (s.includes('T') || s.includes(' ')) {
    const d = toDate(s)
    if (d) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
  }
  return s.slice(0, 5)
}

/** '2026-10-20 09:42:27' → '09:42:27' */
export function jamDetik(val) {
  if (!val) return '—'
  const s = String(val)
  if (s.includes('T')) return s.split('T')[1]?.slice(0, 8) || '—'
  if (s.includes(' ')) return s.split(' ')[1]?.slice(0, 8) || '—'
  return s.slice(0, 8)
}

/** detik → 'mm:ss' atau 'hh:mm:ss' */
export function durasi(detik) {
  const s = Math.max(0, Math.round(Number(detik) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

/** 90 → '90 mnt' / 120 → '2 jam' */
export function durasiMenit(menit) {
  const m = Number(menit) || 0
  if (m >= 60 && m % 60 === 0) return `${m / 60} jam`
  if (m > 60) return `${Math.floor(m / 60)} j ${m % 60} m`
  return `${m} mnt`
}

export const HURUF = ['A', 'B', 'C', 'D', 'E']

/** warna badge per jenis pelanggaran (dipakai jadi `badge badge-${...}`) */
export const JENIS_WARNA = {
  'No Face': 'blue',
  'Multiple Faces': 'red',
  'Looking Away': 'amber',
  'Suspicious Activity': 'red',
  Normal: 'green',
}

export function inisial(nama = '') {
  return nama
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
