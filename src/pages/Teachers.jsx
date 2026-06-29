// src/pages/Teachers.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  BookOpen,
  GraduationCap,
  DollarSign,
  User,
  Globe,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  UserCircle,
  Calendar,
  Award,
  Save,
  X,
  Filter,
  UserPlus,
  UserCheck,
  UserX,
  Loader2
} from 'lucide-react'

const STATUS_LABELS = {
  dang_day: { 
    label: 'Đang dạy', 
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle
  },
  nghi: { 
    label: 'Nghỉ', 
    color: 'bg-red-100 text-red-700',
    icon: XCircle
  },
  hop_dong_het: { 
    label: 'Hết hợp đồng', 
    color: 'bg-gray-100 text-gray-600',
    icon: Clock
  },
}

const EMPTY_FORM = {
  full_name: '', phone: '', email: '', nationality: 'Việt Nam',
  specialization: '', degree: '', hourly_rate: '', status: 'dang_day', note: '',
}

export default function Teachers() {
  const isMobile = useIsMobile()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

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
    setDeleting(true)
    setDeletingId(id)
    await supabase.from('teachers').delete().eq('id', id)
    setDeleting(false)
    setDeletingId(null)
    fetchTeachers()
  }

  const filtered = teachers.filter(t => {
    const matchSearch = t.full_name?.toLowerCase().includes(search.toLowerCase())
      || t.phone?.includes(search)
    const matchStatus = filterStatus ? t.status === filterStatus : true
    return matchSearch && matchStatus
  })

  const renderMobileCard = (teacher) => {
    const StatusIcon = STATUS_LABELS[teacher.status]?.icon
    return (
      <div key={teacher.id} style={{
        background: 'white',
        borderRadius: '8px',
        padding: '14px',
        marginBottom: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #f3f4f6'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 600,
              color: '#1d4ed8'
            }}>
              {teacher.full_name?.charAt(0) || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: '#1f2937' }}>
                {teacher.full_name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={12} />
                {teacher.nationality}
              </div>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[teacher.status]?.color}`}>
            {STATUS_LABELS[teacher.status]?.label}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          fontSize: '12px',
          color: '#6b7280',
          paddingTop: '10px',
          borderTop: '1px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Phone size={12} />
            {teacher.phone || '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Mail size={12} />
            {teacher.email || '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <BookOpen size={12} />
            {teacher.specialization || '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <GraduationCap size={12} />
            {teacher.degree || '—'}
          </div>
          <div style={{ gridColumn: '1/3', fontWeight: 500, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DollarSign size={12} />
            {teacher.hourly_rate ? Number(teacher.hourly_rate).toLocaleString('vi-VN') + 'đ/buổi' : '—'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={() => { setForm(teacher); setShowForm(true) }}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '12px',
              color: '#3b82f6',
              background: 'none',
              border: '1px solid #dbeafe',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Edit size={12} />
            Chỉnh sửa
          </button>
          <button
            onClick={() => deleteTeacher(teacher.id)}
            disabled={deleting && deletingId === teacher.id}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '12px',
              color: '#ef4444',
              background: 'none',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: deleting && deletingId === teacher.id ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            {deleting && deletingId === teacher.id ? (
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
            <Users size={isMobile ? 20 : 24} color="#2563eb" />
            Quản lý Giáo viên
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
            Tổng số: {teachers.length} giáo viên
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
          <UserPlus size={16} />
          Thêm giáo viên
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
            placeholder="Tìm tên, SĐT..."
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

      {/* Teachers Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
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
          <Users size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ color: '#6b7280' }}>Chưa có giáo viên nào</p>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
            {search || filterStatus ? 'Không tìm thấy kết quả phù hợp' : 'Hãy thêm giáo viên mới'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: isMobile ? '10px' : '16px'
        }}>
          {isMobile ? (
            filtered.map(teacher => renderMobileCard(teacher))
          ) : (
            filtered.map(t => {
              const StatusIcon = STATUS_LABELS[t.status]?.icon
              return (
                <div key={t.id} style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '16px',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#1d4ed8'
                      }}>
                        {t.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: '#1f2937', fontSize: '15px' }}>{t.full_name}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Globe size={12} />
                          {t.nationality}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[t.status]?.color}`}>
                      {STATUS_LABELS[t.status]?.label}
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    fontSize: '13px',
                    color: '#6b7280',
                    borderTop: '1px solid #f3f4f6',
                    paddingTop: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={14} />
                      {t.phone || '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={14} />
                      {t.email || '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BookOpen size={14} />
                      {t.specialization || '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <GraduationCap size={14} />
                      {t.degree || '—'}
                    </div>
                    <div style={{ gridColumn: '1/3', fontWeight: 500, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <DollarSign size={14} />
                      {t.hourly_rate ? Number(t.hourly_rate).toLocaleString('vi-VN') + 'đ/buổi' : '—'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                    <button
                      onClick={() => { setForm(t); setShowForm(true) }}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: '#3b82f6',
                        background: 'none',
                        border: '1px solid #dbeafe',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit size={14} />
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => deleteTeacher(t.id)}
                      disabled={deleting && deletingId === t.id}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: '#ef4444',
                        background: 'none',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        opacity: deleting && deletingId === t.id ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      {deleting && deletingId === t.id ? (
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Xoá
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Modal Form */}
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
                    Cập nhật giáo viên
                  </>
                ) : (
                  <>
                    <UserPlus size={20} color="#2563eb" />
                    Thêm giáo viên mới
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Số điện thoại *
                </label>
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Email
                </label>
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Quốc tịch
                </label>
                <select 
                  value={form.nationality} 
                  onChange={e => setForm({...form, nationality: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  <option value="Việt Nam">Việt Nam</option>
                  <option value="Nước ngoài">Nước ngoài</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Chuyên môn
                </label>
                <input 
                  value={form.specialization} 
                  onChange={e => setForm({...form, specialization: e.target.value})}
                  placeholder="VD: IELTS, Giao tiếp..."
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
                  Bằng cấp
                </label>
                <input 
                  value={form.degree} 
                  onChange={e => setForm({...form, degree: e.target.value})}
                  placeholder="VD: Thạc sĩ, Cử nhân..."
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
                  Lương / buổi (đ)
                </label>
                <input 
                  type="number" 
                  value={form.hourly_rate} 
                  onChange={e => setForm({...form, hourly_rate: e.target.value})}
                  placeholder="VD: 200000"
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
                  Trạng thái
                </label>
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
                  {Object.entries(STATUS_LABELS).map(([k,v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1/3' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Ghi chú
                </label>
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
                onClick={saveTeacher} 
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