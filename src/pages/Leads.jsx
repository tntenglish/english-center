import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'

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
  const isMobile = useIsMobile()
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

  const renderMobileCard = (lead) => (
    <div key={lead.id} style={{
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
            {lead.full_name}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            📱 {lead.phone}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
          {STATUS_LABELS[lead.status]?.label}
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
        <div>📌 {SOURCE_LABELS[lead.source] || lead.source}</div>
        <div>📚 {lead.interested_in || '—'}</div>
        <div>📊 {lead.level || '—'}</div>
        <div>👤 {lead.assigned_to || '—'}</div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => enrollLead(lead)} 
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '11px',
            background: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          ✅ Nhập học
        </button>
        <button 
          onClick={() => editLead(lead)} 
          style={{
            padding: '6px 12px',
            fontSize: '11px',
            background: 'none',
            color: '#3b82f6',
            border: '1px solid #dbeafe',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Sửa
        </button>
        <button 
          onClick={() => deleteLead(lead.id)} 
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
            Quản lý Leads
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
            Học viên tiềm năng ({leads.length})
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowForm(true) }}
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
          + Thêm lead
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '8px' : '12px',
        marginBottom: '16px'
      }}>
        <input
          placeholder="Tìm tên, SĐT..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: isMobile ? '8px 12px' : '8px 12px',
            fontSize: isMobile ? '13px' : '14px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            outline: 'none',
            width: isMobile ? '100%' : 'auto'
          }}
        />
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          padding: '4px 0 8px',
          WebkitOverflowScrolling: 'touch',
          flexWrap: isMobile ? 'nowrap' : 'wrap'
        }}>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFilterStatus(filterStatus === k ? '' : k)}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                fontSize: isMobile ? '11px' : '13px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: filterStatus === k ? '#2563eb' : '#e5e7eb',
                background: filterStatus === k ? '#2563eb' : 'white',
                color: filterStatus === k ? 'white' : '#374151',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                flexShrink: 0,
                transition: 'all 0.2s'
              }}
            >
              {v.label}
            </button>
          ))}
          {filterStatus && (
            <button
              onClick={() => setFilterStatus('')}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                fontSize: isMobile ? '11px' : '13px',
                borderRadius: '20px',
                border: '1px solid #e5e7eb',
                background: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                flexShrink: 0
              }}
            >
              ✕ Tất cả
            </button>
          )}
        </div>
      </div>

      {isMobile ? (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Chưa có lead nào</div>
          ) : (
            filtered.map(lead => renderMobileCard(lead))
          )}
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                {['Họ tên','SĐT','Nguồn','Khoá quan tâm','Trình độ','Trạng thái','Tư vấn viên','Thao tác'].map(h => (
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
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Chưa có lead nào</td></tr>
              ) : filtered.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#1f2937' }}>{lead.full_name}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{lead.phone}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{SOURCE_LABELS[lead.source] || lead.source}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{lead.interested_in || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{lead.level || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
                      {STATUS_LABELS[lead.status]?.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{lead.assigned_to || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => enrollLead(lead)} 
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          background: '#16a34a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        ✅ Nhập học
                      </button>
                      <button 
                        onClick={() => editLead(lead)} 
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          background: 'none',
                          color: '#3b82f6',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => deleteLead(lead.id)} 
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
            width: isMobile ? '100%' : '560px',
            maxWidth: '600px',
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
              {form.id ? 'Cập nhật lead' : 'Thêm lead mới'}
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? '10px' : '12px'
            }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Họ tên *</label>
                <input 
                  value={form.full_name} 
                  onChange={e => setForm({...form, full_name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Số điện thoại *</label>
                <input 
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Email</label>
                <input 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Ngày sinh</label>
                <input 
                  type="text" 
                  value={form.date_of_birth} 
                  onChange={e => setForm({...form, date_of_birth: e.target.value})}
                  placeholder="VD: 15/05/1995"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nguồn</label>
                <select 
                  value={form.source} 
                  onChange={e => setForm({...form, source: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  {Object.entries(SOURCE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Trạng thái</label>
                <select 
                  value={form.status} 
                  onChange={e => setForm({...form, status: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Khoá quan tâm</label>
                <select 
                  value={form.interested_in} 
                  onChange={e => setForm({...form, interested_in: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Chọn khoá --</option>
                  {COURSE_OPTIONS.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Trình độ đầu vào</label>
                <select 
                  value={form.level} 
                  onChange={e => setForm({...form, level: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Chọn trình độ --</option>
                  {LEVEL_OPTIONS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1/3' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tư vấn viên</label>
                <input 
                  value={form.assigned_to} 
                  onChange={e => setForm({...form, assigned_to: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1/3' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Ghi chú</label>
                <textarea 
                  value={form.note} 
                  onChange={e => setForm({...form, note: e.target.value})}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button 
                onClick={saveLead} 
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
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button 
                onClick={() => setShowForm(false)}
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