// src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'
import { NAV_ITEMS } from '../constants/navigation'

function Sidebar({ isAdmin, user, profile, signOut }) {
  const isMobile = useIsMobile()
  
  // Nếu là mobile thì không hiển thị sidebar
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
      {/* Header */}
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid #e5e7eb' 
      }}>
        <h1 style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          color: '#1f2937' 
        }}>
          🎓 TNT English
        </h1>
        <p style={{ 
          fontSize: '12px', 
          color: '#9ca3af', 
          marginTop: '2px' 
        }}>
          Quản lý trung tâm
        </p>
      </div>

      {/* Navigation Menu */}
      <nav style={{ 
        flex: 1, 
        padding: '12px', 
        overflowY: 'auto' 
      }}>
        {NAV_ITEMS
          .filter(item => !item.adminOnly || isAdmin)
          .map(item => {
            const Icon = item.icon // Lấy component icon
            return (
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
                {/* Sử dụng Lucide Icon thay vì emoji */}
                <Icon size={20} strokeWidth={2} />
                {item.label}
              </NavLink>
            )
          })}
      </nav>

      {/* User Info & Logout */}
      <div style={{ 
        padding: '12px 16px', 
        borderTop: '1px solid #e5e7eb' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          marginBottom: '8px' 
        }}>
          {user?.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '50%' 
              }}
              onError={e => e.target.style.display = 'none'}
              alt="avatar"
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ 
              fontSize: '12px', 
              fontWeight: 500, 
              color: '#374151',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
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
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={e => e.target.style.color = '#ef4444'}
          onMouseLeave={e => e.target.style.color = '#6b7280'}
        >
          <LogOut size={14} />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}

export default Sidebar