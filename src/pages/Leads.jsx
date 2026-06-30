// src/pages/Leads.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  Target,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  User,
  BookOpen,
  Award,
  UserCheck,
  Filter,
  AlertCircle,
  Save,
  X,
  Clock,
  UserPlus,
  MessageCircle,
  Globe,
  HelpCircle,
  Loader2,
  Users,
  UserCog,
  Share2
} from 'lucide-react'

const STATUS_LABELS = {
  moi: {
    label: 'Mới',
    color: 'bg-blue-100 text-blue-700',
    icon: Clock
  },
  dang_tu_van: {
    label: 'Đang tư vấn',
    color: 'bg-yellow-100 text-yellow-700',
    icon: MessageCircle
  },
  thu_lop: {
    label: 'Thử lớp',
    color: 'bg-purple-100 text-purple-700',
    icon: UserCheck
  },
  nhat_hoc: {
    label: 'Nhập học',
    color: 'bg-green-100 text-green-700',
    icon: UserPlus
  },
  tu_choi: {
    label: 'Từ chối',
    color: 'bg-red-100 text-red-700',
    icon: XCircle
  },
  bao_luu: {
    label: 'Bảo lưu',
    color: 'bg-gray-100 text-gray-600',
    icon: Clock
  },
}

const SOURCE_LABELS = {
  facebook: { label: 'Facebook', icon: Share2 },
  zalo: { label: 'Zalo', icon: MessageCircle },
  gioi_thieu: { label: 'Giới thiệu', icon: Users },
  website: { label: 'Website', icon: Globe },
  khac: { label: 'Khác', icon: HelpCircle },
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
  full_name: '',
  phone: '',
  email: '',
  date_of_birth: '',
  source: 'facebook',
  interested_in: '',
  level: '',
  status: 'dang_tu_van',
  assigned_to: '',
  note: '',
}

export default function Leads() {
  const isMobile = useIsMobile()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrollingId, setEnrollingId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchLeads()
  }, [])

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
      alert('✅ Đã lưu lead thành công!')

    } catch (error) {
      console.error('💥 Lỗi:', error)
      alert(`Có lỗi xảy ra: ${error.message}`)
      setSaving(false)
    }
  }

  async function deleteLead(id) {
    if (!confirm('Bạn có chắc muốn xóa lead này?')) return
    setDeleting(true)
    setDeletingId(id)
    await supabase.from('leads').delete().eq('id', id)
    setDeleting(false)
    setDeletingId(null)
    fetchLeads()
  }

  async function enrollLead(lead) {
    if (!confirm(`Chuyển "${lead.full_name}" thành học viên chính thức?`)) return

    setEnrolling(true)
    setEnrollingId(lead.id)

    try {
      // Kiểm tra học viên đã tồn tại chưa
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('phone', lead.phone)
        .maybeSingle()

      if (existingStudent) {
        alert(`⚠️ Số điện thoại ${lead.phone} đã tồn tại trong danh sách học viên!`)
        setEnrolling(false)
        setEnrollingId(null)
        return
      }

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
        note: `Nhập học từ lead - ${lead.note || ''}`,
        source: lead.source || 'khac'
      }

      const { error: studentError } = await supabase
        .from('students')
        .insert(studentData)

      if (studentError) {
        console.error('❌ Lỗi insert student:', studentError)
        alert(`Lỗi khi tạo học viên: ${studentError.message}`)
        setEnrolling(false)
        setEnrollingId(null)
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
        setEnrolling(false)
        setEnrollingId(null)
        return
      }

      await fetchLeads()
      alert(`✅ Đã nhập học thành công cho ${lead.full_name}!`)

    } catch (error) {
      console.error('💥 Lỗi:', error)
      alert(`Có lỗi xảy ra: ${error.message}`)
    }

    setEnrolling(false)
    setEnrollingId(null)
  }

  function editLead(lead) {
    setForm(lead)
    setShowForm(true)
  }

  const filtered = leads.filter(l => {
    const matchSearch = l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search) ||
      l.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus ? l.status === filterStatus : true
    return matchSearch && matchStatus
  })

  const renderMobileCard = (lead) => {
    const SourceIcon = SOURCE_LABELS[lead.source]?.icon

    return (
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
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={12} />
              {lead.phone}
            </div>
            {lead.email && (
              <div style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={11} />
                {lead.email}
              </div>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
            {STATUS_LABELS[lead.status]?.label}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {SourceIcon && <SourceIcon size={12} />}
            {SOURCE_LABELS[lead.source]?.label || lead.source}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <BookOpen size={12} />
            {lead.interested_in || '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Award size={12} />
            {lead.level || '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} />
            {lead.assigned_to || '—'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => enrollLead(lead)}
            disabled={enrolling && enrollingId === lead.id}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '11px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer',
              opacity: enrolling && enrollingId === lead.id ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            {enrolling && enrollingId === lead.id ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <UserPlus size={14} />
            )}
            {enrolling && enrollingId === lead.id ? 'Đang xử lý...' : 'Nhập học'}
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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Edit size={12} />
            Sửa
          </button>
          <button
            onClick={() => deleteLead(lead.id)}
            disabled={deleting && deletingId === lead.id}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              background: 'none',
              color: '#ef4444',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: deleting && deletingId === lead.id ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {deleting && deletingId === lead.id ? (
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Trash2 size={12} />
            )}
            Xoá
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: isMobile ? '12px 10px' : '24px',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '0',
        marginBottom: '16px'
      }}>
        <div>
          <h2 style={{
            fontSize: isMobile ? '18px' : '24px',
            fontWeight: 600,
            color: '#1f2937',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Target size={isMobile ? 20 : 24} color="#2563eb" />
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
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} />
          Thêm lead
        </button>
      </div>

      {/* Search and Filter */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '8px' : '12px',
        marginBottom: '16px'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }} />
          <input
            placeholder="Tìm tên, SĐT, Email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px 12px 8px 36px' : '8px 12px 8px 36px',
              fontSize: isMobile ? '13px' : '14px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
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
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {filterStatus === k ? <CheckCircle size={12} /> : <Filter size={12} />}
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
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <X size={12} />
              Tất cả
            </button>
          )}
        </div>
      </div>

      {/* Mobile View */}
      {isMobile ? (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p>Đang tải...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <Target size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ color: '#6b7280' }}>Chưa có lead nào</p>
              <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
                {search || filterStatus ? 'Không tìm thấy kết quả phù hợp' : 'Hãy thêm lead mới'}
              </p>
            </div>
          ) : (
            filtered.map(lead => renderMobileCard(lead))
          )}
        </div>
      ) : (
        /* Desktop View */
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                {['Họ tên', 'SĐT', 'Nguồn', 'Khoá quan tâm', 'Trình độ', 'Trạng thái', 'Tư vấn viên', 'Thao tác'].map(h => (
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
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                    <p style={{ marginTop: '8px' }}>Đang tải...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{
                    textAlign: 'center',
                    padding: '40px 0',
                    color: '#9ca3af'
                  }}>
                    {search || filterStatus ? 'Không tìm thấy kết quả' : 'Chưa có lead nào'}
                  </td>
                </tr>
              ) : filtered.map(lead => {
                const SourceIcon = SOURCE_LABELS[lead.source]?.icon
                return (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#1f2937' }}>
                      {lead.full_name}
                      {lead.email && (
                        <div style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={11} />
                          {lead.email}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                      <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {lead.phone}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {SourceIcon && <SourceIcon size={14} />}
                        {SOURCE_LABELS[lead.source]?.label || lead.source}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                      {lead.interested_in || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                      {lead.level || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
                        {STATUS_LABELS[lead.status]?.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                      {lead.assigned_to || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => enrollLead(lead)}
                          disabled={enrolling && enrollingId === lead.id}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            opacity: enrolling && enrollingId === lead.id ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {enrolling && enrollingId === lead.id ? (
                            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <UserPlus size={12} />
                          )}
                          {enrolling && enrollingId === lead.id ? 'Đang...' : 'Nhập học'}
                        </button>
                        <button
                          onClick={() => editLead(lead)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            background: 'none',
                            color: '#3b82f6',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit size={12} />
                          Sửa
                        </button>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          disabled={deleting && deletingId === lead.id}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            background: 'none',
                            color: '#ef4444',
                            border: 'none',
                            cursor: 'pointer',
                            opacity: deleting && deletingId === lead.id ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {deleting && deletingId === lead.id ? (
                            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
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
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: 600,
                color: '#1f2937',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {form.id ? (
                  <>
                    <Edit size={20} color="#2563eb" />
                    Cập nhật lead
                  </>
                ) : (
                  <>
                    <Plus size={20} color="#2563eb" />
                    Thêm lead mới
                  </>
                )}
              </h3>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? '10px' : '12px'
            }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Họ tên *
                </label>
                <input
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Số điện thoại *
                </label>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Email
                </label>
                <input
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Ngày sinh
                </label>
                <input
                  type="text"
                  value={form.date_of_birth}
                  onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Nguồn
                </label>
                <select
                  value={form.source}
                  onChange={e => setForm({ ...form, source: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Trạng thái
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Khoá quan tâm
                </label>
                <select
                  value={form.interested_in}
                  onChange={e => setForm({ ...form, interested_in: e.target.value })}
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Trình độ đầu vào
                </label>
                <select
                  value={form.level}
                  onChange={e => setForm({ ...form, level: e.target.value })}
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Tư vấn viên
                </label>
                <input
                  value={form.assigned_to}
                  onChange={e => setForm({ ...form, assigned_to: e.target.value })}
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Ghi chú
                </label>
                <textarea
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
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
                  opacity: saving ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Lưu
                  </>
                )}
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
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

      {/* Animation styles */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}