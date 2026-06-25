import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const STATUS_LABELS = {
  dang_day:     { label: 'Đang dạy',     color: 'bg-green-100 text-green-700' },
  nghi:         { label: 'Nghỉ',         color: 'bg-red-100 text-red-700' },
  hop_dong_het: { label: 'Hết hợp đồng', color: 'bg-gray-100 text-gray-600' },
}

const EMPTY_FORM = {
  full_name: '', phone: '', email: '', nationality: 'Việt Nam',
  specialization: '', degree: '', hourly_rate: '', status: 'dang_day', note: '',
}

export default function Teachers() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { fetchTeachers() }, [])

  async function fetchTeachers() {
    setLoading(true)
    const { data } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false })
    setTeachers(data || [])
    setLoading(false)
  }

  async function saveTeacher() {
    if (!form.full_name || !form.phone) return alert('Vui lòng nhập họ tên và số điện thoại!')
    setSaving(true)
    const payload = { ...form }
    if (!payload.hourly_rate) payload.hourly_rate = 0
    if (form.id) {
      await supabase.from('teachers').update(payload).eq('id', form.id)
    } else {
      await supabase.from('teachers').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    setForm(EMPTY_FORM)
    fetchTeachers()
  }

  async function deleteTeacher(id) {
    if (!confirm('Xoá giáo viên này?')) return
    await supabase.from('teachers').delete().eq('id', id)
    fetchTeachers()
  }

  const filtered = teachers.filter(t => {
    const matchSearch = t.full_name?.toLowerCase().includes(search.toLowerCase())
      || t.phone?.includes(search)
    const matchStatus = filterStatus ? t.status === filterStatus : true
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Quản lý Giáo viên</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tổng số: {teachers.length} giáo viên</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowForm(true) }}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Thêm giáo viên
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Tìm tên, SĐT..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:border-blue-400"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Cards giáo viên */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-10">Chưa có giáo viên nào</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                    {t.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{t.full_name}</p>
                    <p className="text-xs text-gray-400">{t.nationality}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[t.status]?.color}`}>
                  {STATUS_LABELS[t.status]?.label}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500 border-t border-gray-100 pt-3">
                <div className="flex justify-between">
                  <span>SĐT</span><span className="text-gray-700">{t.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chuyên môn</span><span className="text-gray-700">{t.specialization || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bằng cấp</span><span className="text-gray-700">{t.degree || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lương/buổi</span>
                  <span className="text-gray-700 font-medium">
                    {t.hourly_rate ? Number(t.hourly_rate).toLocaleString('vi-VN') + 'đ' : '—'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => { setForm(t); setShowForm(true) }}
                  className="flex-1 text-xs text-blue-600 border border-blue-200 rounded-lg py-1.5 hover:bg-blue-50 transition"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => deleteTeacher(t.id)}
                  className="flex-1 text-xs text-red-500 border border-red-200 rounded-lg py-1.5 hover:bg-red-50 transition"
                >
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {form.id ? 'Cập nhật giáo viên' : 'Thêm giáo viên mới'}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Họ tên *</label>
                  <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Số điện thoại *</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email</label>
                  <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Quốc tịch</label>
                  <select value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    <option value="Việt Nam">Việt Nam</option>
                    <option value="Nước ngoài">Nước ngoài</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Chuyên môn</label>
                  <input value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})}
                    placeholder="VD: IELTS, Giao tiếp..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Bằng cấp</label>
                  <input value={form.degree} onChange={e => setForm({...form, degree: e.target.value})}
                    placeholder="VD: Thạc sĩ, Cử nhân..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Lương / buổi (đ)</label>
                  <input type="number" value={form.hourly_rate} onChange={e => setForm({...form, hourly_rate: e.target.value})}
                    placeholder="VD: 200000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Trạng thái</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ghi chú</label>
                <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={saveTeacher} disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}