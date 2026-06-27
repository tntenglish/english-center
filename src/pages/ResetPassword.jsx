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
      // Cập nhật mật khẩu mới
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setMessage(`❌ Lỗi: ${error.message}`)
        setLoading(false)
        return
      }

      // Lấy user hiện tại
      const { data: userData } = await supabase.auth.getUser()
      
      if (userData?.user) {
        // Cập nhật must_change_password = false trong profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('id', userData.user.id)

        if (profileError) {
          console.error('Lỗi cập nhật profile:', profileError)
          // Vẫn tiếp tục vì mật khẩu đã được đổi
        }
      }

      setMessage('✅ Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
      
      // Đăng xuất sau khi đổi mật khẩu
      await supabase.auth.signOut()
      
      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (error) {
      setMessage(`❌ Lỗi: ${error.message}`)
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
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
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
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {message && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              background: message.includes('✅') ? '#d1fae5' : '#fee2e2',
              color: message.includes('✅') ? '#065f46' : '#dc2626',
              border: message.includes('✅') ? '1px solid #a7f3d0' : '1px solid #fecaca'
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
              opacity: loading ? 0.6 : 1,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => !loading && (e.target.style.background = '#1d4ed8')}
            onMouseLeave={e => !loading && (e.target.style.background = '#2563eb')}
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