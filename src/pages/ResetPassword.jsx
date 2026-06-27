import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleResetPassword(e) {
    e.preventDefault()
    
    if (password.length < 6) {
      setMessage('Mật khẩu phải có ít nhất 6 ký tự!')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp!')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setMessage(`Lỗi: ${error.message}`)
      } else {
        setMessage('✅ Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (error) {
      setMessage(`Lỗi: ${error.message}`)
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
        padding: '32px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937' }}>
            🔑 Đặt lại mật khẩu
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Nhập mật khẩu mới của bạn
          </p>
        </div>

        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '4px'
            }}>
              Mật khẩu mới *
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none'
              }}
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
              Xác nhận mật khẩu *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
          </div>

          {message && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              background: message.includes('✅') ? '#d1fae5' : '#fee2e2',
              color: message.includes('✅') ? '#065f46' : '#dc2626'
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              fontWeight: 500,
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <a href="/login" style={{ fontSize: '14px', color: '#2563eb', textDecoration: 'none' }}>
            ← Quay lại đăng nhập
          </a>
        </div>
      </div>
    </div>
  )
}