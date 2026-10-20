import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../lib/icons'
import { inisial } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from './ui'

export default function PesertaLayout({ examTitle, examSub }) {
  const { user, logout } = useAuth()
  const confirm = useConfirm()
  const nav = useNavigate()
  const loc = useLocation()

  // judul topbar mengikuti halaman aktif
  if (!examTitle) {
    if (loc.pathname.startsWith('/peserta/ujian')) {
      examTitle = 'Sesi Ujian'
      examSub = 'Sedang berlangsung'
    } else if (loc.pathname.startsWith('/peserta/hasil')) {
      examTitle = 'Hasil Ujian'
      examSub = 'Rekap jawaban & pengawasan'
    }
  }

  const keluar = async () => {
    const ok = await confirm({
      title: 'Keluar dari sistem?',
      message: 'Kamu akan kembali ke halaman login.',
      yes: 'Keluar',
    })
    if (!ok) return
    await logout()
    nav('/login', { replace: true })
  }

  return (
    <div className="p-shell">
      <header className="p-topbar">
        <a className="brand" href="/peserta" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="brand-mark">CAT</div>
          <div>
            <b>CAT UTBK</b>
            <span>Universitas</span>
          </div>
        </a>
        <div className="divider" />
        <div className="exam-label">
          {examTitle ? (
            <>
              <b>{examTitle}</b>
              <span>{examSub || ''}</span>
            </>
          ) : (
            <>
              <b>Portal Peserta</b>
              <span>Pilih ujian yang tersedia</span>
            </>
          )}
        </div>
        <div className="spacer" />
        <div className="p-user">
          <div className="who">
            <b>{user?.nama_lengkap}</b>
            <span>{user?.username}</span>
          </div>
          <div className="avatar">{inisial(user?.nama_lengkap || 'P')}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={keluar}>
          <Icon name="logout" size={16} /> Keluar
        </button>
      </header>

      <main className="p-content">
        <Outlet />
      </main>
    </div>
  )
}
