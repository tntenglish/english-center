import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const STATUS_LABELS = {
  chua_thanh_toan: { label: 'Chưa thanh toán', color: 'bg-red-100 text-red-700' },
  da_thanh_toan:   { label: 'Đã thanh toán',   color: 'bg-green-100 text-green-700' },
  hoan_tien:       { label: 'Hoàn tiền',        color: 'bg-gray-100 text-gray-600' },
}

const METHOD_LABELS = {
  tien_mat:      'Tiền mặt',
  chuyen_khoan:  'Chuyển khoản',
  the:           'Thẻ',
  khac:          'Khác',
}

const EMPTY_FORM = {
  student_id: '', class_id: '', amount: '',
  discount: '0', method: 'tien_mat',
  status: 'chua_thanh_toan', note: '', paid_at: '',
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [students, setStudents] = useState([])
  const [classes, setClasses]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [p, s, c] = await Promise.all([
      supabase.from('payments').select(`
        *, students(full_name, phone), classes(name)
      `).order('created_at', { ascending: false }),
      supabase.from('students').select('id, full_name').eq('status', 'dang_hoc'),
      supabase.from('classes').select('id, name').eq('status', 'dang_hoc'),
    ])
    setPayments(p.data || [])
    setStudents(s.data || [])
    setClasses(c.data || [])
    setLoading(false)
  }

  async function savePayment() {
    if (!form.student_id) return alert('Vui lòng chọn học viên!')
    if (!form.amount)     return alert('Vui lòng nhập số tiền!')
    setSaving(true)
    const payload = { ...form }
    if (!payload.class_id) delete payload.class_id
    if (!payload.paid_at)  delete payload.paid_at
    if (payload.status === 'da_thanh_toan' && !payload.paid_at) {
      payload.paid_at = new Date().toISOString()
    }
    if (form.id) {
      await supabase.from('payments').update(payload).eq('id', form.id)
    } else {
      await supabase.from('payments').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    setForm(EMPTY_FORM)
    fetchAll()
  }

  async function deletePayment(id) {
    if (!confirm('Xoá hoá đơn này?')) return
    await supabase.from('payments').delete().eq('id', id)
    fetchAll()
  }

  async function markPaid(payment) {
    await supabase.from('payments').update({
      status: 'da_thanh_toan',
      paid_at: new Date().toISOString()
    }).eq('id', payment.id)
    fetchAll()
  }

  const filtered = payments.filter(p => {
    const matchSearch = p.students?.full_name?.toLowerCase().includes(search.toLowerCase())
      || p.students?.phone?.includes(search)
    const matchStatus = filterStatus ? p.status === filterStatus : true
    return matchSearch && matchStatus
  })

  // Tổng doanh thu đã thu
  const totalPaid = payments
    .filter(p => p.status === 'da_thanh_toan')
    .reduce((sum, p) => sum + Number(p.final_amount || p.amount), 0)

  const totalUnpaid = payments
    .filter(p => p.status === 'chua_thanh_toan')
    .reduce((sum, p) => sum + Number(p.final_amount || p.amount), 0)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Quản lý Học phí</h2>
          <p className="text-sm text-gray-400 mt-0.5">Thu chi và công nợ</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowForm(true) }}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Tạo hoá đơn
        </button>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Đã thu</p>
          <p className="text-xl font-semibold text-green-600">
            {totalPaid.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Chưa thu</p>
          <p className="text-xl font-semibold text-red-500">
            {totalUnpaid.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Tổng hoá đơn</p>
          <p className="text-xl font-semibold text-gray-800">{payments.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Tìm tên, SĐT học viên..."
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Học viên','Lớp học','Học phí','Giảm giá','Thực thu','Hình thức','Trạng thái',''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Chưa có hoá đơn nào</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{p.students?.full_name}</p>
                  <p className="text-xs text-gray-400">{p.students?.phone}</p>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.classes?.name || '—'}</td>
                <td className="px-4 py-3 text-gray-700">
                  {Number(p.amount).toLocaleString('vi-VN')}đ
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {p.discount > 0 ? Number(p.discount).toLocaleString('vi-VN') + 'đ' : '—'}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {Number(p.final_amount || p.amount).toLocaleString('vi-VN')}đ
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {METHOD_LABELS[p.method] || p.method}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[p.status]?.color}`}>
                    {STATUS_LABELS[p.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {p.status === 'chua_thanh_toan' && (
                      <button onClick={() => markPaid(p)}
                        className="text-green-600 hover:text-green-800 text-xs font-medium">
                        Thu tiền
                      </button>
                    )}
                    <button onClick={() => { setForm({...p, class_id: p.class_id || '', paid_at: ''}); setShowForm(true) }}
                      className="text-blue-500 hover:text-blue-700 text-xs">Sửa</button>
                    <button onClick={() => deletePayment(p.id)}
                      className="text-red-400 hover:text-red-600 text-xs">Xoá</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {form.id ? 'Cập nhật hoá đơn' : 'Tạo hoá đơn mới'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Học viên *</label>
                <select value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                  <option value="">-- Chọn học viên --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Lớp học</label>
                <select value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                  <option value="">-- Chọn lớp --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Học phí (đ) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                    placeholder="VD: 3500000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Giảm giá (đ)</label>
                  <input type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              {form.amount && (
                <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-500">Thực thu: </span>
                  <span className="font-semibold text-blue-700">
                    {(Number(form.amount) - Number(form.discount || 0)).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Hình thức</label>
                  <select value={form.method} onChange={e => setForm({...form, method: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    {Object.entries(METHOD_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
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
              <button onClick={savePayment} disabled={saving}
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