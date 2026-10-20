import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../lib/icons'
import { inisial } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from './ui'

const NAV = [
  { group: 'Ringkasan' },
  { to: '/admin', end: true, icon: 'dashboard', label: 'Dashboard' },
  { group: 'Manajemen Ujian' },
  { to: '/admin/ujian', icon: 'exam', label: 'Data Ujian' },
  { to: '/admin/soal', icon: 'question', label: 'Bank Soal' },
  { group: 'Integritas' },
  { to: '/admin/laporan', icon: 'shield', label: 'Laporan Pelanggaran' },
  { group: 'Pengaturan' },
  { to: '/admin/pengguna', icon: 'users', label: 'Data Pengguna' },
]

const JUDUL = {
  '/admin': ['Dashboard', 'Ringkasan sistem'],
  '/admin/ujian': ['Data Ujian', 'Manajemen ujian'],
  '/admin/soal': ['Bank Soal', 'Manajemen ujian'],
  '/admin/laporan': ['Laporan Proctoring', 'Integritas ujian'],
  '/admin/pengguna': ['Data Pengguna', 'Manajemen akun'],
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const confirm = useConfirm()
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)

  const [title, crumbs] = JUDUL[loc.pathname] || ['Panel Admin', '']

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
    <div className="shell">
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">CAT</div>
          <div className="brand-text">
            <b>CAT UTBK</b>
            <span>Panel Admin</span>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((item, i) =>
            item.group ? (
              <div className="nav-group" key={`g${i}`}>
                <div className="nav-title">{item.group}</div>
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <span className="ico">
                  <Icon name={item.icon} size={17} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="side-foot">
          <div className="side-user">
            <div className="avatar">{inisial(user?.nama_lengkap || 'A')}</div>
            <div className="who">
              <b>{user?.nama_lengkap}</b>
              <span>{user?.role}</span>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={keluar}
              title="Keluar"
              style={{ marginLeft: 'auto', color: '#c3d2e3' }}
            >
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="btn btn-icon" onClick={() => setOpen((v) => !v)} aria-label="Menu" data-menu>
            <Icon name="menu" size={18} />
          </button>
          <div>
            <div className="page-title">{title}</div>
            {crumbs && <div className="crumbs">{crumbs}</div>}
          </div>
          <div className="spacer" />
          <a className="btn btn-sm" href="/peserta" target="_blank" rel="noopener noreferrer">
            <Icon name="eye" size={15} /> Lihat sisi peserta
          </a>
          <button className="btn btn-icon" onClick={keluar} title="Keluar">
            <Icon name="logout" size={18} />
          </button>
        </header>

        <main className="content" onClick={() => open && setOpen(false)}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
