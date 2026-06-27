import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'

const ROLE_LABELS = {
  admin:     { label: 'Admin',     color: 'bg-blue-100 text-blue-700' },
  nhan_vien: { label: 'Nhân viên', color: 'bg-gray-100 text-gray-600' },
}

export default function UserManagement() {
  const isMobile = useIsMobile()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ 
    email: '', 
    full_name: '', 
    role: 'nhan_vien',
    password: '' 
  })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  function handleRandomPassword() {
    const newPassword = generateRandomPassword()
    setForm({ ...form, password: newPassword })
  }

  function showSuccessMessage() {
    alert(
      `✅ ĐÃ TẠO TÀI KHOẢN THÀNH CÔNG!\n\n` +
      `📧 Email: ${form.email}\n` +
      `🔑 Mật khẩu: ${form.password}\n` +
      `👤 Họ tên: ${form.full_name}\n` +
      `🔐 Quyền: ${form.role === 'admin' ? 'Admin' : 'Nhân viên'}\n\n` +
      `📝 Vui lòng sao chép thông tin và gửi cho nhân viên!\n` +
      `⚠️ Nhân viên sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu.`
    )
    
    setShowForm(false)
    setForm({ email: '', full_name: '', role: 'nhan_vien', password: '' })
    fetchUsers()
  }

  async function createUser() {
    if (!form.email || !form.full_name) {
      alert('Vui lòng điền đầy đủ thông tin!')
      return
    }

    if (!form.password || form.password.length < 6) {
      alert('Vui lòng nhập mật khẩu (ít nhất 6 ký tự)!')
      return
    }
    
    setSaving(true)
    try {
      // Kiểm tra email đã tồn tại trong profiles chưa
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', form.email)
        .maybeSingle()

      if (existingProfile) {
        alert(`❌ Email ${form.email} đã tồn tại trong hệ thống!`)
        setSaving(false)
        return
      }

      // Tạo user bằng signUp
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { 
            full_name: form.full_name,
            role: form.role
          },
          emailRedirectTo: window.location.origin + '/login'
        }
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          alert(`❌ Email ${form.email} đã được đăng ký! Vui lòng sử dụng email khác.`)
        } else {
          alert(`❌ Lỗi tạo tài khoản: ${signUpError.message}`)
        }
        setSaving(false)
        return
      }

      if (!authData || !authData.user) {
        alert('❌ Không thể tạo tài khoản. Vui lòng thử lại!')
        setSaving(false)
        return
      }

      // Đợi 2 giây để Supabase hoàn tất việc tạo user
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Tạo profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: form.email,
          full_name: form.full_name,
          role: form.role,
          must_change_password: true
        })

      if (profileError) {
        console.error('Lỗi tạo profile:', profileError)
        alert(`❌ Lỗi tạo profile: ${profileError.message}`)
        setSaving(false)
        return
      }

      showSuccessMessage()

    } catch (error) {
      alert(`❌ Lỗi: ${error.message}`)
    }
    setSaving(false)
  }

  async function updateRole(userId, newRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (error) {
      alert(`Lỗi: ${error.message}`)
    } else {
      await fetchUsers()
    }
  }

  async function deleteUser(userId, email) {
    if (!confirm(`Xoá tài khoản "${email}"?`)) return
    
    try {
      await supabase.from('profiles').delete().eq('id', userId)
      await fetchUsers()
      alert('✅ Đã xóa tài khoản!')
    } catch (error) {
      alert(`❌ Lỗi: ${error.message}`)
    }
  }

  async function resetPassword(user) {
    setSelectedUser(user)
    setShowResetModal(true)
  }

  async function sendResetPassword() {
    if (!selectedUser) return
    
    setSaving(true)
    try {
      // Tạo mật khẩu mới ngẫu nhiên
      const newPassword = generateRandomPassword()
      
      // Gửi email thông báo mật khẩu mới
      const { error: emailError } = await supabase.auth.signInWithOtp({
        email: selectedUser.email,
        options: {
          data: {
            full_name: selectedUser.full_name,
            new_password: newPassword,
            reset_type: 'manual'
          }
        }
      })

      if (emailError) {
        console.error('Lỗi gửi email:', emailError)
        // Thử cách gửi link reset
        const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
          redirectTo: window.location.origin + '/reset-password'
        })

        if (error) {
          alert(`❌ Lỗi: ${error.message}`)
        } else {
          alert(
            `✅ ĐÃ GỬI LINK ĐẶT LẠI MẬT KHẨU!\n\n` +
            `📧 Email: ${selectedUser.email}\n` +
            `👤 Họ tên: ${selectedUser.full_name}\n\n` +
            `📝 Vui lòng kiểm tra email (có thể trong Spam) và bấm vào link để đặt lại mật khẩu.\n` +
            `⚠️ Nhân viên sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần sau.`
          )
        }
        
        setShowResetModal(false)
        setSelectedUser(null)
        setSaving(false)
        return
      }

      // Cập nhật must_change_password = true để yêu cầu đổi mật khẩu
      await supabase
        .from('profiles')
        .update({ must_change_password: true })
        .eq('id', selectedUser.id)

      alert(
        `✅ ĐÃ GỬI MẬT KHẨU MỚI!\n\n` +
        `📧 Email: ${selectedUser.email}\n` +
        `🔑 Mật khẩu mới: ${newPassword}\n` +
        `👤 Họ tên: ${selectedUser.full_name}\n\n` +
        `📝 Vui lòng sao chép thông tin và gửi cho nhân viên!\n` +
        `⚠️ Nhân viên sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần sau.`
      )
      
      setShowResetModal(false)
      setSelectedUser(null)
      await fetchUsers()

    } catch (error) {
      alert(`❌ Lỗi: ${error.message}`)
    }
    setSaving(false)
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const renderMobileCard = (user) => (
    <div key={user.id} style={{
      background: 'white',
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #f3f4f6'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px', color: '#1f2937' }}>
            {user.full_name || '—'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            ✉️ {user.email}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_LABELS[user.role]?.color || 'bg-gray-100 text-gray-600'}`}>
          {ROLE_LABELS[user.role]?.label || 'Nhân viên'}
        </span>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '10px',
        borderTop: '1px solid #f3f4f6',
        marginBottom: '10px'
      }}>
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
          {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}
        </span>
        <select
          value={user.role || 'nhan_vien'}
          onChange={e => updateRole(user.id, e.target.value)}
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            background: 'white',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="admin">Admin</option>
          <option value="nhan_vien">Nhân viên</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button
          onClick={() => resetPassword(user)}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '11px',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          🔑 Đặt lại MK
        </button>
        <button
          onClick={() => deleteUser(user.id, user.email)}
          style={{
            padding: '6px 12px',
            fontSize: '11px',
            background: 'none',
            color: '#ef4444',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Xoá
        </button>
      </div>
    </div>
  )

  return (
    <div style={{
      padding: isMobile ? '12px 10px' : '24px',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '0',
        marginBottom: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
            Phân quyền User
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
            Quản lý tài khoản và quyền truy cập ({users.length})
          </p>
        </div>
        <button
          onClick={() => { 
            setShowForm(true)
            const randomPass = generateRandomPassword()
            setForm({ email: '', full_name: '', role: 'nhan_vien', password: randomPass })
          }}
          style={{
            padding: isMobile ? '8px 16px' : '8px 20px',
            fontSize: isMobile ? '13px' : '14px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}
        >
          + Mời nhân viên
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          placeholder="Tìm tên, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: isMobile ? '8px 12px' : '8px 12px',
            fontSize: isMobile ? '13px' : '14px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            outline: 'none',
            width: isMobile ? '100%' : '256px'
          }}
        />
      </div>

      {isMobile ? (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Chưa có user nào</div>
          ) : (
            filtered.map(user => renderMobileCard(user))
          )}
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                {['Họ tên', 'Email', 'Quyền', 'Ngày tạo', ''].map(h => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid #f3f4f6' }}>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Chưa có user nào</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#1f2937' }}>{u.full_name || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={u.role || 'nhan_vien'}
                      onChange={e => updateRole(u.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${
                        ROLE_LABELS[u.role]?.color || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <option value="admin">Admin</option>
                      <option value="nhan_vien">Nhân viên</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '12px' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => resetPassword(u)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🔑 Đặt lại MK
                      </button>
                      <button
                        onClick={() => deleteUser(u.id, u.email)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          background: 'none',
                          color: '#ef4444',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: isMobile ? '12px' : '0'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: isMobile ? '100%' : '500px',
            maxWidth: '550px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: isMobile ? '20px 16px' : '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 600,
              color: '#1f2937',
              marginBottom: '16px'
            }}>
              👤 Mời nhân viên
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr',
              gap: '12px'
            }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Họ tên *
                </label>
                <input
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="VD: nhanvien@gmail.com"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Mật khẩu *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Nhập mật khẩu hoặc bấm Random"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRandomPassword}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    🎲 Random
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Quyền
                </label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  <option value="nhan_vien">Nhân viên</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{
                background: '#eff6ff',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: '#1d4ed8'
              }}>
                📝 Admin sẽ copy thông tin tài khoản và gửi cho nhân viên.
                <br />
                ⚠️ Nhân viên sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={createUser}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '14px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Đang tạo...' : '➕ Tạo tài khoản'}
              </button>
              <button
                onClick={() => { 
                  setShowForm(false)
                  setForm({ email: '', full_name: '', role: 'nhan_vien', password: '' })
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '14px',
                  background: 'none',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && selectedUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: isMobile ? '12px' : '0'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: isMobile ? '100%' : '400px',
            maxWidth: '450px',
            padding: isMobile ? '20px 16px' : '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 600,
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              🔑 Đặt lại mật khẩu
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
              Gửi thông tin đặt lại mật khẩu đến email:
            </p>
            <p style={{ 
              fontSize: '15px', 
              fontWeight: 600, 
              color: '#1f2937', 
              marginBottom: '4px',
              wordBreak: 'break-all'
            }}>
              {selectedUser.email}
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              👤 {selectedUser.full_name || 'Chưa có tên'}
            </p>

            <div style={{
              background: '#eff6ff',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
              color: '#1d4ed8',
              marginBottom: '16px'
            }}>
              📧 Email sẽ chứa mật khẩu mới hoặc link để đặt lại mật khẩu.
              <br />
              ⚠️ Nhân viên sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần sau.
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={sendResetPassword}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '14px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Đang gửi...' : '📧 Gửi reset'}
              </button>
              <button
                onClick={() => { setShowResetModal(false); setSelectedUser(null) }}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '14px',
                  background: 'none',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}