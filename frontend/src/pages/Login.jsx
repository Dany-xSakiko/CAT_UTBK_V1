import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../lib/icons'
import { useAuth } from '../context/AuthContext'
import { pesanError } from '../lib/api'

export default function Login() {
  const { login, user } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [role, setRole] = useState('Peserta')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [lihat, setLihat] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (user) nav(user.role === 'Admin' ? '/admin' : '/peserta', { replace: true })
  }, [user, nav])

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!username.trim() || !password) {
      setErr('Username dan password wajib diisi.')
      return
    }
    try {
      const u = await login(username.trim(), password, role)
      nav(u.role === 'Admin' ? '/admin' : '/peserta', { replace: true })
    } catch (e2) {
      setErr(pesanError(e2, 'Username atau password salah.'))
    }
  }

  return (
    <div className="auth">
      {/* ---------------- panel kiri ---------------- */}
      <aside className="auth-side">
        <div className="brand">
          <div className="brand-mark">CAT</div>
          <div>
            <b>CAT UTBK</b>
            <span>Computer Assisted Test</span>
          </div>
        </div>

        <div className="auth-hero">
          <h1>
            Ujian berbasis komputer dengan <em>pengawasan kamera</em> otomatis.
          </h1>
          <p>
            Sistem CAT yang memantau integritas peserta secara berkala, mencatat setiap pelanggaran,
            dan menghitung skor secara otomatis.
          </p>

          <div className="auth-points">
            <div className="auth-point">
              <span className="tick">1</span>
              <div>
                <b>Pengerjaan terstruktur</b>
                <br />
                Soal pilihan ganda dengan timer dan penyimpanan jawaban otomatis.
              </div>
            </div>
            <div className="auth-point">
              <span className="tick">2</span>
              <div>
                <b>Deteksi kecurangan</b>
                <br />
                Frame kamera dianalisis tiap 3 detik untuk mendeteksi wajah tidak ada atau lebih dari satu.
              </div>
            </div>
            <div className="auth-point">
              <span className="tick">3</span>
              <div>
                <b>Laporan pelanggaran</b>
                <br />
                Setiap anomali tersimpan lengkap dengan waktu dan bukti screenshot.
              </div>
            </div>
          </div>
        </div>

        <div className="foot">
          Program Studi Teknik Informatika · Universitas Nusantara PGRI Kediri
          <br />
          Kelompok 2 — Kelas 4D
        </div>
      </aside>

      {/* ---------------- panel kanan ---------------- */}
      <main className="auth-main">
        <div className="auth-card">
          <h2>Masuk ke akun</h2>
          <p className="lead">Gunakan akun yang diberikan panitia ujian.</p>

          <div className="role-switch" role="tablist" aria-label="Pilih peran">
            <button
              type="button"
              className={role === 'Peserta' ? 'active' : ''}
              onClick={() => setRole('Peserta')}
              role="tab"
              aria-selected={role === 'Peserta'}
            >
              <Icon name="user" size={16} />
              Peserta
            </button>
            <button
              type="button"
              className={role === 'Admin' ? 'active' : ''}
              onClick={() => setRole('Admin')}
              role="tab"
              aria-selected={role === 'Admin'}
            >
              <Icon name="shield" size={16} />
              Admin
            </button>
          </div>

          {loc.search.includes('expired') && !err && (
            <div className="alert alert-warn" style={{ marginBottom: 16 }}>
              <span className="alert-ico">
                <Icon name="alert" size={18} />
              </span>
              <div>
                <b>Sesi berakhir</b>Silakan masuk kembali untuk melanjutkan.
              </div>
            </div>
          )}

          {err && (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              <span className="alert-ico">
                <Icon name="alert" size={18} />
              </span>
              <div>
                <b>Gagal masuk</b>
                <span>{err}</span>
              </div>
            </div>
          )}

          <form onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="username">Username</label>
              <div className="input-group">
                <span className="ico">
                  <Icon name="user" size={17} />
                </span>
                <input
                  className="input"
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="contoh: peserta_001"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-group">
                <span className="ico">
                  <Icon name="lock" size={17} />
                </span>
                <input
                  className="input"
                  id="password"
                  name="password"
                  type={lihat ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setLihat((v) => !v)}
                  aria-label={lihat ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <Icon name={lihat ? 'eyeOff' : 'eye'} size={17} />
                </button>
              </div>
            </div>

            <div className="between" style={{ margin: '-4px 0 18px' }}>
              <label className="flex items-center gap-8 small" style={{ cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span className="muted">Ingat sesi saya</span>
              </label>
              <a
                href="#"
                className="small"
                onClick={(e) => e.preventDefault()}
                title="Hubungi panitia ujian"
              >
                Lupa password?
              </a>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-block" id="btnLogin">
              Masuk
            </button>
          </form>

          <div className="demo-box">
            <b>Akun demo</b> — peserta: <code>peserta_001</code> · admin: <code>admin</code>
            <br />
            password: <code>demo123</code>
          </div>

          <p className="foot-note">
            Dengan masuk, kamu menyetujui pemantauan kamera selama ujian berlangsung.
          </p>
        </div>
      </main>
    </div>
  )
}
