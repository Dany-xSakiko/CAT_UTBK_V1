import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AdminLayout from './components/AdminLayout'
import PesertaLayout from './components/PesertaLayout'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUjian from './pages/admin/Ujian'
import AdminSoal from './pages/admin/Soal'
import AdminPengguna from './pages/admin/Pengguna'
import AdminLaporan from './pages/admin/Laporan'
import PesertaDashboard from './pages/peserta/Dashboard'
import PesertaUjian from './pages/peserta/Ujian'
import PesertaHasil from './pages/peserta/Hasil'

function Splash({ pesan = 'Memuat sesi…' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#64748b' }}>
      <div className="flex">
        <span className="spinner" />
        {pesan}
      </div>
    </div>
  )
}

function Guard({ role, children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()

  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (user.role !== role) {
    return <Navigate to={user.role === 'Admin' ? '/admin' : '/peserta'} replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <Guard role="Admin">
            <AdminLayout />
          </Guard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="ujian" element={<AdminUjian />} />
        <Route path="soal" element={<AdminSoal />} />
        <Route path="pengguna" element={<AdminPengguna />} />
        <Route path="laporan" element={<AdminLaporan />} />
      </Route>

      <Route
        path="/peserta"
        element={
          <Guard role="Peserta">
            <PesertaLayout />
          </Guard>
        }
      >
        <Route index element={<PesertaDashboard />} />
        <Route path="hasil/:id" element={<PesertaHasil />} />
      </Route>

      {/* ruang ujian punya layout sendiri (exam-shell), tanpa topbar peserta */}
      <Route
        path="/peserta/ujian/:id"
        element={
          <Guard role="Peserta">
            <PesertaUjian />
          </Guard>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
