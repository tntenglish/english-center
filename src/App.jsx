import { useState, useEffect } from 'react'
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

const BOTTOM_NAV = [
  { to: '/',           label: 'Tổng quan',  icon: '📊' },
  { to: '/leads',      label: 'Leads',      icon: '🎯' },
  { to: '/students',   label: 'Học viên',   icon: '👨‍🎓' },
  { to: '/attendance', label: 'Điểm danh',  icon: '✅' },
  { to: '/classes',    label: 'Lớp học',    icon: '🏫' },
]

// Hook detect màn hình
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

function Sidebar({ isAdmin, user, profile, signOut }) {
  const isMobile = useIsMobile()
  if (isMobile) return null

  return (
    <aside style={{
      width: '224px',
      background: 'white',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
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
                isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
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
            <img src={user.user_metadata.avatar_url}
              className="w-7 h-7 rounded-full"
              onError={e => e.target.style.display = 'none'} />
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
        <button onClick={signOut}
          className="w-full text-xs text-gray-500 hover:text-red-500 text-left transition mt-1">
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}

function MobileHeader({ user, profile, signOut }) {
  const isMobile = useIsMobile()
  const isAdmin = profile?.role === 'admin'
  const [showMenu, setShowMenu] = useState(false)

  if (!isMobile) return null

  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 40,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <div>
            <h1 className="text-sm font-semibold text-gray-800 leading-none">TNT English</h1>
            <p className="text-xs text-gray-400">Quản lý trung tâm</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {isAdmin ? 'Admin' : 'NV'}
          </span>
          <div className="relative">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url}
                style={{width:32,height:32,borderRadius:'50%',cursor:'pointer',border:'1px solid #e5e7eb'}}
                onError={e => e.target.style.display = 'none'}
                onClick={() => setShowMenu(!showMenu)} />
            ) : (
              <div onClick={() => setShowMenu(!showMenu)}
                style={{width:32,height:32,borderRadius:'50%',background:'#dbeafe',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                <span style={{color:'#1d4ed8',fontSize:12,fontWeight:'bold'}}>
                  {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
                </span>
              </div>
            )}
            {showMenu && (
              <div style={{
                position:'absolute', right:0, top:40,
                background:'white', border:'1px solid #e5e7eb',
                borderRadius:12, padding:12, width:192, zIndex:50,
                boxShadow:'0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <p className="text-xs text-gray-500 truncate mb-2">{profile?.full_name || user?.email}</p>
                <button onClick={() => { signOut(); setShowMenu(false) }}
                  className="w-full text-left text-sm text-red-500 py-1">
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {showMenu && <div style={{position:'fixed',inset:0,zIndex:30}} onClick={() => setShowMenu(false)} />}
    </>
  )
}

function BottomNav() {
  const isMobile = useIsMobile()
  if (!isMobile) return null

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: 'white',
      borderTop: '1px solid #e5e7eb',
      zIndex: 40,
      display: 'flex',
    }}>
      {BOTTOM_NAV.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 0 10px', textDecoration:'none'}}
        >
          {({ isActive }) => (
            <>
              <span style={{fontSize:22, lineHeight:1}}>{item.icon}</span>
              <span style={{
                fontSize:11, marginTop:2,
                color: isActive ? '#2563eb' : '#9ca3af',
                fontWeight: isActive ? 600 : 400,
              }}>
                {item.label}
              </span>
              {isActive && <div style={{width:4,height:4,borderRadius:'50%',background:'#2563eb',marginTop:2}} />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function Layout() {
  const { user, profile, signOut } = useAuth()
  const isMobile = useIsMobile()
  const isAdmin = profile?.role === 'admin'



  return (
    <div style={{display:'flex', height:'100vh', background:'#f9fafb'}}>
      <Sidebar isAdmin={isAdmin} user={user} profile={profile} signOut={signOut} />

      <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
        <MobileHeader user={user} profile={profile} signOut={signOut} />

        <main style={{
          flex: 1,
          overflow: 'auto',
          paddingTop: isMobile ? '56px' : '0',
          paddingBottom: isMobile ? '64px' : '0',
        }}>
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/leads"      element={<Leads />} />
            <Route path="/students"   element={<Students />} />
            <Route path="/classes"    element={<Classes />} />
            <Route path="/teachers"   element={<Teachers />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/payments"   element={isAdmin ? <Payments />  : <Navigate to="/" replace />} />
            <Route path="/revenue"    element={isAdmin ? <Revenue />   : <Navigate to="/" replace />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#9ca3af',fontSize:14}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8}}>🎓</div>
        <p>Đang tải...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#9ca3af',fontSize:14}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8}}>🎓</div>
        <p>Đang tải...</p>
      </div>
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