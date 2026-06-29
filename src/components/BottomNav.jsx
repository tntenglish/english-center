// src/components/BottomNav.jsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { BOTTOM_NAV } from '../constants/navigation'

function BottomNav() {
  const isMobile = useIsMobile()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  // Nếu không phải mobile thì không hiển thị
  if (!isMobile) return null

  // Lọc menu theo quyền
  const visibleNavItems = BOTTOM_NAV.filter(
    item => !item.adminOnly || isAdmin
  )

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
    }}>
      {visibleNavItems.map(item => {
        const Icon = item.icon
        return (
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
                {/* Sử dụng Lucide Icon */}
                <Icon 
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  color={isActive ? '#2563eb' : '#6b7280'}
                />
                <span style={{
                  fontSize: '9px',
                  marginTop: '2px',
                  color: isActive ? '#2563eb' : '#9ca3af',
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}>
                  {item.label}
                </span>
                {/* Active indicator */}
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
        )
      })}
    </nav>
  )
}

export default BottomNav