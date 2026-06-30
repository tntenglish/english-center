import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (error) {
        setError('❌ ' + error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, must_change_password')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile) {
          setError('❌ Tài khoản chưa được cấp quyền truy cập. Vui lòng liên hệ Admin!')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        if (profile.must_change_password === true) {
          navigate('/reset-password')
        } else {
          navigate('/')
        }
      }
    } catch (error) {
      setError('❌ Có lỗi xảy ra: ' + error.message)
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px 32px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {/* Logo và tiêu đề */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.png"
            alt="TNT English Logo"
            style={{
              height: '64px',
              width: 'auto',
              margin: '0 auto 12px',
              display: 'block'
            }}
          />
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#1f2937',
            margin: 0
          }}>
            TNT English
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            marginTop: '4px'
          }}>
            Hệ thống quản lý trung tâm
          </p>
        </div>

        {/* Form đăng nhập */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '4px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nhập email của bạn"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '4px'
            }}>
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="nhập mật khẩu"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              background: '#fee2e2',
              color: '#dc2626'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              fontWeight: 500,
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => !loading && (e.target.style.background = '#1d4ed8')}
            onMouseLeave={e => !loading && (e.target.style.background = '#2563eb')}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          <p style={{ margin: 0 }}>
            Chỉ tài khoản được cấp quyền mới có thể đăng nhập
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>
            Liên hệ Admin để được cấp tài khoản
          </p>
        </div>
      </div>
    </div>
  )
}