import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const STATUS_LABELS = {
  moi:         { label: 'Mới',        color: 'bg-blue-100 text-blue-700' },
  dang_tu_van: { label: 'Đang tư vấn', color: 'bg-yellow-100 text-yellow-700' },
  thu_lop:     { label: 'Thử lớp',    color: 'bg-purple-100 text-purple-700' },
  nhat_hoc:    { label: 'Nhập học',   color: 'bg-green-100 text-green-700' },
  tu_choi:     { label: 'Từ chối',    color: 'bg-red-100 text-red-700' },
  bao_luu:     { label: 'Bảo lưu',   color: 'bg-gray-100 text-gray-600' },
}

const SOURCE_LABELS = {
  facebook:    'Facebook',
  zalo:        'Zalo',
  gioi_thieu:  'Giới thiệu',
  website:     'Website',
  khac:        'Khác',
}

const COURSE_OPTIONS = [
  'Tiếng Anh Giao Tiếp',
  'TOEIC',
  'IELTS'
]

const LEVEL_OPTIONS = [
  '1A',
  '1B',
  '2A',
  '2B',
  '3A',
  '3B',
  'Skill bằng Tiếng Anh'
]

const EMPTY_FORM = {
  full_name: '', phone: '', email: '', date_of_birth: '',
  source: 'facebook', interested_in: '', level: '',
  status: 'dang_tu_van', assigned_to: '', note: '',
}

export default function Leads() {
  const [leads, setLeads]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { fetchLeads() }, [])

  async function fetchLeads() {
    setLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Lỗi fetch leads:', error)
    } else {
      console.log('Số leads:', data?.length || 0)
    }
    
    setLeads(data || [])
    setLoading(false)
  }

  async function saveLead() {
    if (!form.full_name || !form.phone) {
      alert('Vui lòng nhập họ tên và số điện thoại!')
      return
    }
    
    setSaving(true)
    
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email ? form.email.trim() : '',
        date_of_birth: form.date_of_birth ? form.date_of_birth.trim() : '',
        source: form.source || 'facebook',
        interested_in: form.interested_in || '',
        level: form.level || '',
        status: form.status || 'dang_tu_van',
        assigned_to: form.assigned_to || '',
        note: form.note || ''
      }
      
      console.log('📦 Payload:', payload)
      
      let result
      if (form.id) {
        result = await supabase.from('leads').update(payload).eq('id', form.id)
      } else {
        result = await supabase.from('leads').insert(payload)
      }
      
      if (result.error) {
        console.error('❌ Lỗi:', result.error)
        alert(`Lỗi: ${result.error.message}`)
        setSaving(false)
        return
      }
      
      setSaving(false)
      setShowForm(false)
      setForm(EMPTY_FORM)
      await fetchLeads()
      alert('✅ Đã thêm lead thành công!')
      
    } catch (error) {
      console.error('💥 Lỗi:', error)
      alert(`Có lỗi xảy ra: ${error.message}`)
      setSaving(false)
    }
  }

  async function deleteLead(id) {
    if (!confirm('Xoá lead này?')) return
    await supabase.from('leads').delete().eq('id', id)
    fetchLeads()
  }

  async function enrollLead(lead) {
    if (!confirm(`Chuyển "${lead.full_name}" thành học viên chính thức?`)) return
    
    try {
      const studentData = {
        full_name: lead.full_name,
        phone: lead.phone,
        email: lead.email || null,
        date_of_birth: lead.date_of_birth || null,
        gender: 'nam',
        address: null,
        parent_name: null,
        parent_phone: null,
        level: lead.level || null,
        status: 'dang_hoc',
        note: `Nhập học từ lead - ${lead.note || ''}`
      }

      const { error: studentError } = await supabase
        .from('students')
        .insert(studentData)

      if (studentError) {
        console.error('❌ Lỗi insert student:', studentError)
        alert(`Lỗi khi tạo học viên: ${studentError.message}`)
        return
      }

      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id)

      if (deleteError) {
        console.error('❌ Lỗi delete lead:', deleteError)
        alert(`Đã tạo học viên nhưng không xóa được lead: ${deleteError.message}`)
        await fetchLeads()
        return
      }

      await fetchLeads()
      alert(`✅ Đã nhập học thành công cho ${lead.full_name}!`)
      
    } catch (error) {
      console.error('💥 Lỗi:', error)
      alert(`Có lỗi xảy ra: ${error.message}`)
    }
  }

  function editLead(lead) {
    setForm(lead)
    setShowForm(true)
  }

  const filtered = leads.filter(l => {
    const matchSearch = l.full_name?.toLowerCase().includes(search.toLowerCase())
      || l.phone?.includes(search)
    const matchStatus = filterStatus ? l.status === filterStatus : true
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Quản lý Leads</h2>
          <p className="text-sm text-gray-400 mt-0.5">Học viên tiềm năng ({leads.length})</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowForm(true) }}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Thêm lead
        </button>
      </div>

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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Họ tên','SĐT','Nguồn','Khoá quan tâm','Trình độ','Trạng thái','Tư vấn viên','Thao tác'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Chưa có lead nào</td></tr>
            ) : filtered.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-800">{lead.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{lead.phone}</td>
                <td className="px-4 py-3 text-gray-500">{SOURCE_LABELS[lead.source] || lead.source}</td>
                <td className="px-4 py-3 text-gray-500">{lead.interested_in || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{lead.level || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
                    {STATUS_LABELS[lead.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{lead.assigned_to || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    <button 
                      onClick={() => enrollLead(lead)} 
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition shadow-sm"
                    >
                      ✅ Nhập học
                    </button>
                    <button 
                      onClick={() => editLead(lead)} 
                      className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1"
                    >
                      Sửa
                    </button>
                    <button 
                      onClick={() => deleteLead(lead.id)} 
                      className="text-red-400 hover:text-red-600 text-xs px-2 py-1"
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {form.id ? 'Cập nhật lead' : 'Thêm lead mới'}
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
                  <label className="text-xs text-gray-500 mb-1 block">Ngày sinh</label>
                  <input type="text" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})}
                    placeholder="VD: 15/05/1995"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nguồn</label>
                  <select value={form.source} onChange={e => setForm({...form, source: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    {Object.entries(SOURCE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Khoá quan tâm</label>
                  <select value={form.interested_in} onChange={e => setForm({...form, interested_in: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    <option value="">-- Chọn khoá --</option>
                    {COURSE_OPTIONS.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Trình độ đầu vào</label>
                  <select value={form.level} onChange={e => setForm({...form, level: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    <option value="">-- Chọn trình độ --</option>
                    {LEVEL_OPTIONS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tư vấn viên</label>
                <input value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ghi chú</label>
                <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={saveLead} disabled={saving}
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