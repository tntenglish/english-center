import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROLE_LABELS = {
  admin:     { label: 'Admin',     color: 'bg-blue-100 text-blue-700' },
  nhan_vien: { label: 'Nhân viên', color: 'bg-gray-100 text-gray-600' },
}

export default function UserManagement() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ email: '', full_name: '', role: 'nhan_vien' })
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')

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

  async function createUser() {
    if (!form.email || !form.full_name) {
      alert('Vui lòng điền đầy đủ thông tin!')
      return
    }
    setSaving(true)
    try {
      // Kiểm tra email đã tồn tại chưa
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', form.email)
        .maybeSingle()

      if (existing) {
        // Cập nhật role nếu đã tồn tại
        await supabase
          .from('profiles')
          .update({ role: form.role, full_name: form.full_name })
          .eq('email', form.email)
        alert(`✅ Đã cập nhật quyền cho ${form.email}!`)
      } else {
        // Gửi magic link mời đăng nhập
        const { error } = await supabase.auth.signInWithOtp({
          email: form.email,
          options: {
            data: { full_name: form.full_name },
            emailRedirectTo: 'https://english-center-v2.vercel.app/'
          }
        })
        if (error) {
          alert(`Lỗi: ${error.message}`)
          setSaving(false)
          return
        }
        alert(`✅ Đã gửi link đăng nhập đến ${form.email}!\n\nNhân viên chỉ cần bấm link trong email là vào được hệ thống.`)
      }

      setShowForm(false)
      setForm({ email: '', full_name: '', role: 'nhan_vien' })
      fetchUsers()
    } catch (error) {
      alert(`Lỗi: ${error.message}`)
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
      fetchUsers()
    }
  }

  async function deleteUser(userId, email) {
    if (!confirm(`Xoá tài khoản ${email}?`)) return
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
    if (error) {
      alert(`Lỗi: ${error.message}`)
    } else {
      await fetchUsers()
      alert('✅ Đã xoá tài khoản!')
    }
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Phân quyền User</h2>
          <p className="text-sm text-gray-400 mt-0.5">Quản lý tài khoản và quyền truy cập</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Mời nhân viên
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          placeholder="Tìm tên, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Họ tên', 'Email', 'Quyền', 'Ngày tạo', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Chưa có user nào</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-800">{u.full_name || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => deleteUser(u.id, u.email)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal mời nhân viên */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Mời nhân viên</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Họ tên *</label>
                <input
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="VD: nhanvien@gmail.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Quyền</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                >
                  <option value="nhan_vien">Nhân viên</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                📧 Hệ thống sẽ gửi link đăng nhập đến email nhân viên. Họ chỉ cần bấm link là vào được!
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={createUser}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Đang gửi...' : '📧 Gửi link mời'}
              </button>
              <button
                onClick={() => { setShowForm(false); setForm({ email: '', full_name: '', role: 'nhan_vien' }) }}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
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