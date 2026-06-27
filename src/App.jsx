import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import Leads          from './pages/Leads'
import Students       from './pages/Students'
import Classes        from './pages/Classes'
import Teachers       from './pages/Teachers'
import Attendance     from './pages/Attendance'
import Revenue        from './pages/Revenue'
import UserManagement from './pages/UserManagement'
import ResetPassword  from './pages/ResetPassword'

const NAV_ITEMS = [
  { to: '/',           label: 'Dashboard',  icon: '📊', adminOnly: false },
  { to: '/leads',      label: 'Leads',      icon: '🎯', adminOnly: false },
  { to: '/students',   label: 'Học viên',   icon: '👨‍🎓', adminOnly: false },
  { to: '/classes',    label: 'Lớp học',    icon: '🏫', adminOnly: false },
  { to: '/teachers',   label: 'Giáo viên',  icon: '👩‍🏫', adminOnly: false },
  { to: '/attendance', label: 'Điểm danh',  icon: '✅', adminOnly: false },
  { to: '/revenue',    label: 'Doanh thu',  icon: '📈', adminOnly: true  },
  { to: '/users',      label: 'Phân quyền', icon: '👥', adminOnly: true  },
]

const BOTTOM_NAV = [
  { to: '/',           label: 'Tổng quan',  icon: '📊', adminOnly: false },
  { to: '/leads',      label: 'Leads',      icon: '🎯', adminOnly: false },
  { to: '/students',   label: 'Học viên',   icon: '👨‍🎓', adminOnly: false },
  { to: '/attendance', label: 'Điểm danh',  icon: '✅', adminOnly: false },
  { to: '/classes',    label: 'Lớp học',    icon: '🏫', adminOnly: false },
  { to: '/teachers',   label: 'Giáo viên',  icon: '👩‍🏫', adminOnly: false },
  { to: '/revenue',    label: 'Doanh thu',  icon: '📈', adminOnly: true  },
  { to: '/users',      label: 'Phân quyền', icon: '👥', adminOnly: true  },
]

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
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
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>🎓 TNT English</h1>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Quản lý trung tâm</p>
      </div>

      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              textDecoration: 'none',
              color: isActive ? '#1d4ed8' : '#4b5563',
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              fontWeight: isActive ? 500 : 400,
              marginBottom: '4px',
              transition: 'all 0.2s'
            })}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          {user?.user_metadata?.avatar_url && (
            <img 
              src={user.user_metadata.avatar_url}
              style={{ width: '28px', height: '28px', borderRadius: '50%' }}
              onError={e => e.target.style.display = 'none'} 
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.full_name || user?.email}
            </p>
            <span style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 500,
              backgroundColor: isAdmin ? '#dbeafe' : '#f3f4f6',
              color: isAdmin ? '#1d4ed8' : '#6b7280'
            }}>
              {isAdmin ? 'Admin' : 'Nhân viên'}
            </span>
          </div>
        </div>
        <button 
          onClick={signOut}
          style={{
            width: '100%',
            fontSize: '12px',
            color: '#6b7280',
            background: 'none',
            border: 'none',
            textAlign: 'left',
            padding: '4px 0',
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.target.style.color = '#ef4444'}
          onMouseLeave={e => e.target.style.color = '#6b7280'}
        >
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
        top: 0, 
        left: 0, 
        right: 0,
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 40,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🎓</span>
          <div>
            <h1 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', lineHeight: 1.2 }}>TNT English</h1>
            <p style={{ fontSize: '10px', color: '#9ca3af' }}>Quản lý trung tâm</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: 500,
            backgroundColor: isAdmin ? '#dbeafe' : '#f3f4f6',
            color: isAdmin ? '#1d4ed8' : '#6b7280'
          }}>
            {isAdmin ? 'Admin' : 'NV'}
          </span>
          <div style={{ position: 'relative' }}>
            {user?.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  border: '2px solid #e5e7eb',
                  objectFit: 'cover'
                }}
                onError={e => e.target.style.display = 'none'}
                onClick={() => setShowMenu(!showMenu)} 
              />
            ) : (
              <div 
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid #e5e7eb'
                }}
              >
                <span style={{ color: '#1d4ed8', fontSize: '13px', fontWeight: 'bold' }}>
                  {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
                </span>
              </div>
            )}
            {showMenu && (
              <>
                <div 
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 49,
                    background: 'rgba(0,0,0,0.3)'
                  }} 
                  onClick={() => setShowMenu(false)} 
                />
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '40px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px',
                  width: '200px',
                  zIndex: 50,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  minWidth: '180px'
                }}>
                  <p style={{ 
                    fontSize: '13px', 
                    fontWeight: 500,
                    color: '#1f2937',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '8px'
                  }}>
                    {profile?.full_name || user?.email}
                  </p>
                  <p style={{ 
                    fontSize: '11px', 
                    color: '#6b7280',
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    {user?.email}
                  </p>
                  <button 
                    onClick={() => { signOut(); setShowMenu(false) }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '14px',
                      color: '#ef4444',
                      background: 'none',
                      border: 'none',
                      padding: '6px 0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>🚪</span> Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  )
}

function BottomNav() {
  const isMobile = useIsMobile()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  
  if (!isMobile) return null

  const visibleNavItems = BOTTOM_NAV.filter(item => !item.adminOnly || isAdmin)

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, 
      left: 0, 
      right: 0,
      background: 'white',
      borderTop: '1px solid #e5e7eb',
      zIndex: 40,
      display: 'flex',
      padding: '4px 0 6px',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
      height: '60px',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      {visibleNavItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          style={{
            flex: '1 0 auto',
            minWidth: '56px',
            maxWidth: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 2px',
            textDecoration: 'none',
            position: 'relative'
          }}
        >
          {({ isActive }) => (
            <>
              <span style={{
                fontSize: '22px',
                lineHeight: 1,
                opacity: isActive ? 1 : 0.7,
                transition: 'opacity 0.2s'
              }}>
                {item.icon}
              </span>
              <span style={{
                fontSize: '9px',
                marginTop: '2px',
                color: isActive ? '#2563eb' : '#9ca3af',
                fontWeight: isActive ? 600 : 400,
                whiteSpace: 'nowrap',
                transition: 'color 0.2s'
              }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '3px',
                  background: '#2563eb',
                  borderRadius: '0 0 3px 3px'
                }} />
              )}
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
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#f9fafb',
      overflow: 'hidden'
    }}>
      <Sidebar isAdmin={isAdmin} user={user} profile={profile} signOut={signOut} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: '100%'
      }}>
        <MobileHeader user={user} profile={profile} signOut={signOut} />

        <main style={{
          flex: 1,
          overflow: 'auto',
          paddingTop: isMobile ? '56px' : '0',
          paddingBottom: isMobile ? '60px' : '0',
          paddingLeft: isMobile ? '8px' : '24px',
          paddingRight: isMobile ? '8px' : '24px',
          paddingTop: isMobile ? '64px' : '24px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/leads"      element={<Leads />} />
            <Route path="/students"   element={<Students />} />
            <Route path="/classes"    element={<Classes />} />
            <Route path="/teachers"   element={<Teachers />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/revenue"    element={isAdmin ? <Revenue /> : <Navigate to="/" replace />} />
            <Route path="/users"      element={isAdmin ? <UserManagement /> : <Navigate to="/" replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#f9fafb'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎓</div>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Đang tải...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#f9fafb'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎓</div>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Đang tải...</p>
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
          <Route path="/reset-password" element={<ResetPassword />} />
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