import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import Leads      from './pages/Leads'
import Students   from './pages/Students'
import Classes    from './pages/Classes'
import Teachers   from './pages/Teachers'
import Payments   from './pages/Payments'
import Attendance from './pages/Attendance'
import Revenue    from './pages/Revenue'

const NAV_ITEMS = [
  { to: '/',           label: 'Dashboard',  icon: '📊', adminOnly: false },
  { to: '/leads',      label: 'Leads',      icon: '🎯', adminOnly: false },
  { to: '/students',   label: 'Học viên',   icon: '👨‍🎓', adminOnly: false },
  { to: '/classes',    label: 'Lớp học',    icon: '🏫', adminOnly: false },
  { to: '/teachers',   label: 'Giáo viên',  icon: '👩‍🏫', adminOnly: false },
  { to: '/attendance', label: 'Điểm danh',  icon: '✅', adminOnly: false },
  { to: '/payments',   label: 'Học phí',    icon: '💰', adminOnly: true  },
  { to: '/revenue',    label: 'Doanh thu',  icon: '📈', adminOnly: true  },
]

function Layout() {
  const { user, profile, signOut } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200">
          <h1 className="text-base font-semibold text-gray-800">🎓 TNT English</h1>
          <p className="text-xs text-gray-400 mt-0.5">Quản lý trung tâm</p>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            {user?.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                className="w-7 h-7 rounded-full"
                onError={e => e.target.style.display = 'none'}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {profile?.full_name || user?.email}
              </p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {isAdmin ? 'Admin' : 'Nhân viên'}
              </span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full text-xs text-gray-500 hover:text-red-500 text-left transition mt-1"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/leads"      element={<Leads />} />
          <Route path="/students"   element={<Students />} />
          <Route path="/classes"    element={<Classes />} />
          <Route path="/teachers"   element={<Teachers />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/payments"   element={isAdmin ? <Payments /> : <Navigate to="/" replace />} />
          <Route path="/revenue"    element={isAdmin ? <Revenue /> : <Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
      Đang tải...
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
      Đang tải...
    </div>
  )

  if (user) return <Navigate to="/" replace />
  return <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}