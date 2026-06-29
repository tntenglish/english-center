// src/components/MobileHeader.jsx
import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

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
        {/* Logo */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px' 
        }}>
          <span style={{ fontSize: '20px' }}>🎓</span>
          <div>
            <h1 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#1f2937', 
              lineHeight: 1.2 
            }}>
              TNT English
            </h1>
            <p style={{ 
              fontSize: '10px', 
              color: '#9ca3af' 
            }}>
              Quản lý trung tâm
            </p>
          </div>
        </div>

        {/* User Info */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px' 
        }}>
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
            {/* Avatar */}
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
                onClick={() => setShowMenu(!showMenu)}
                alt="avatar"
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
                <span style={{ 
                  color: '#1d4ed8', 
                  fontSize: '13px', 
                  fontWeight: 'bold' 
                }}>
                  {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
                </span>
              </div>
            )}

            {/* Dropdown Menu */}
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
                }}>
                  <p style={{ 
                    fontSize: '13px', 
                    fontWeight: 500, 
                    color: '#1f2937',
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
                    onClick={() => { 
                      signOut()
                      setShowMenu(false) 
                    }}
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
                    <LogOut size={16} />
                    Đăng xuất
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

export default MobileHeader