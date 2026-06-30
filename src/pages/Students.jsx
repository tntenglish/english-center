// src/pages/Students.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import * as XLSX from 'xlsx'
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  Calendar,
  User,
  BookOpen,
  Award,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X,
  Filter,
  UserPlus,
  UserCheck,
  UserX,
  Loader2,
  ChevronRight,
  School,
  FileSpreadsheet,
  Clock,
  GraduationCap,
  Home,
  CalendarDays
} from 'lucide-react'

const STATUS_LABELS = {
  dang_hoc:   { label: 'Đang học',   color: 'bg-green-100 text-green-700' },
  bao_luu:    { label: 'Bảo lưu',    color: 'bg-yellow-100 text-yellow-700' },
  tot_nghiep: { label: 'Tốt nghiệp', color: 'bg-blue-100 text-blue-700' },
  nghi_hoc:   { label: 'Nghỉ học',   color: 'bg-red-100 text-red-700' },
}

const LEVEL_OPTIONS = [
  '1A', '1B', '2A', '2B', '3A', '3B', 'Skill bằng Tiếng Anh'
]

const EMPTY_FORM = {
  full_name: '', phone: '', email: '', date_of_birth: '',
  gender: 'nam', address: '', level: '',
  status: 'dang_hoc', note: '', tuition_fee: '',
}

export default function Students() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [students, setStudents]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [studentClassStatus, setStudentClassStatus] = useState({})
  const [showClassModal, setShowClassModal]         = useState(false)
  const [selectedStudent, setSelectedStudent]       = useState(null)
  const [classList, setClassList]                   = useState([])
  const [selectedClass, setSelectedClass]           = useState('')
  const [assigning, setAssigning]                   = useState(false)
  const [showViewClassModal, setShowViewClassModal] = useState(false)
  const [studentClasses, setStudentClasses]         = useState([])
  const [loadingStudentClasses, setLoadingStudentClasses] = useState(false)
  
  // Mobile detail modal
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailStudent, setDetailStudent] = useState(null)

  useEffect(() => {
    fetchStudents()
    fetchClasses()
  }, [])

  useEffect(() => {
    const checkAllStudents = async () => {
      const status = {}
      for (const student of students) {
        const { data } = await supabase
          .from('class_students')
          .select('id')
          .eq('student_id', student.id)
          .limit(1)
        status[student.id] = data && data.length > 0
      }
      setStudentClassStatus(status)
    }
    if (students.length > 0) checkAllStudents()
  }, [students])

  async function fetchStudents() {
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    setStudents(data || [])
    setLoading(false)
  }

  async function fetchClasses() {
    const { data } = await supabase
      .from('classes')
      .select('id, name, status')
      .eq('status', 'dang_hoc')
    setClassList(data || [])
  }

  async function fetchStudentClasses(studentId) {
    setLoadingStudentClasses(true)
    try {
      const { data } = await supabase
        .from('class_students')
        .select('id, class_id, classes(id, name, status)')
        .eq('student_id', studentId)
      setStudentClasses(data || [])
    } catch (error) {
      console.error('Lỗi fetch student classes:', error)
      setStudentClasses([])
    }
    setLoadingStudentClasses(false)
  }

  async function saveStudent() {
    if (!form.full_name || !form.phone) {
      alert('Vui lòng nhập họ tên và số điện thoại!')
      return
    }
    setSaving(true)
    try {
      const payload = {
        full_name:    form.full_name.trim(),
        phone:        form.phone.trim(),
        email:        form.email ? form.email.trim() : '',
        date_of_birth: form.date_of_birth || '',
        gender:       form.gender || 'nam',
        address:      form.address || '',
        level:        form.level || '',
        status:       form.status || 'dang_hoc',
        note:         form.note || '',
        tuition_fee:  form.tuition_fee ? parseInt(form.tuition_fee) : 0,
        tuition_paid: false,
      }
      let result
      if (form.id) {
        const currentStudent = students.find(s => s.id === form.id)
        payload.tuition_paid = currentStudent?.tuition_paid || false
        result = await supabase.from('students').update(payload).eq('id', form.id)
      } else {
        result = await supabase.from('students').insert(payload)
      }
      if (result.error) {
        alert(`Lỗi khi lưu: ${result.error.message}`)
        setSaving(false)
        return
      }
      setSaving(false)
      setShowForm(false)
      setForm(EMPTY_FORM)
      await fetchStudents()
      alert(form.id ? '✅ Đã cập nhật học viên!' : '✅ Đã thêm học viên!')
    } catch (error) {
      alert(`Có lỗi xảy ra: ${error.message}`)
      setSaving(false)
    }
  }

  async function deleteStudent(id) {
    if (!confirm('Xoá học viên này?')) return
    const { data: classData } = await supabase
      .from('class_students').select('id').eq('student_id', id)
    if (classData && classData.length > 0) {
      if (!confirm('Học viên đang có trong lớp. Xoá sẽ xoá cả quan hệ lớp. Tiếp tục?')) return
      await supabase.from('class_students').delete().eq('student_id', id)
    }
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) {
      alert(`Lỗi xóa: ${error.message}`)
    } else {
      await fetchStudents()
      alert('✅ Đã xóa học viên!')
    }
  }

  async function toggleTuitionPaid(student) {
    const newStatus = !student.tuition_paid
    const { error } = await supabase
      .from('students').update({ tuition_paid: newStatus }).eq('id', student.id)
    if (error) {
      alert(`Lỗi: ${error.message}`)
    } else {
      await fetchStudents()
    }
  }

  async function assignStudentToClass() {
    if (!selectedClass) { alert('Vui lòng chọn một lớp!'); return }
    setAssigning(true)
    try {
      const { data: existing } = await supabase
        .from('class_students').select('*')
        .eq('class_id', selectedClass).eq('student_id', selectedStudent.id)
      if (existing && existing.length > 0) {
        alert('⚠️ Học viên này đã có trong lớp!')
        setAssigning(false)
        return
      }
      const { error } = await supabase.from('class_students').insert({
        class_id: selectedClass, student_id: selectedStudent.id
      })
      if (error) {
        alert(`Lỗi xếp lớp: ${error.message}`)
      } else {
        alert(`✅ Đã xếp học viên "${selectedStudent.full_name}" vào lớp!`)
        setShowClassModal(false)
        setSelectedStudent(null)
        setSelectedClass('')
        await fetchStudents()
      }
    } catch (error) {
      alert(`Có lỗi xảy ra: ${error.message}`)
    }
    setAssigning(false)
  }

  async function removeStudentFromClass(classStudentId) {
    if (!confirm('Xoá học viên này khỏi lớp?')) return
    const { error } = await supabase
      .from('class_students').delete().eq('id', classStudentId)
    if (error) {
      alert(`Lỗi: ${error.message}`)
    } else {
      alert('✅ Đã xóa học viên khỏi lớp!')
      await fetchStudentClasses(selectedStudent.id)
      await fetchStudents()
    }
  }

  async function openClassModal(student) {
    setSelectedStudent(student)
    setSelectedClass('')
    const { data } = await supabase
      .from('class_students').select('id').eq('student_id', student.id).limit(1)
    const hasClass = data && data.length > 0
    if (hasClass) {
      await fetchStudentClasses(student.id)
      setShowViewClassModal(true)
    } else {
      setShowClassModal(true)
      await fetchClasses()
    }
  }

  function editStudent(student) {
    setForm({
      id:           student.id,
      full_name:    student.full_name || '',
      phone:        student.phone || '',
      email:        student.email || '',
      date_of_birth: student.date_of_birth || '',
      gender:       student.gender || 'nam',
      address:      student.address || '',
      level:        student.level || '',
      status:       student.status || 'dang_hoc',
      note:         student.note || '',
      tuition_fee:  student.tuition_fee || '',
    })
    setShowForm(true)
  }

  // Mở modal chi tiết trên mobile
  function openDetailModal(student) {
    setDetailStudent(student)
    setShowDetailModal(true)
  }

  const filtered = students.filter(s => {
    const matchSearch = s.full_name?.toLowerCase().includes(search.toLowerCase())
      || s.phone?.includes(search)
    const matchStatus = filterStatus ? s.status === filterStatus : true
    return matchSearch && matchStatus
  })

  function exportToExcel() {
    const dataToExport = filtered.map((s, index) => ({
      'STT':         index + 1,
      'Họ tên':      s.full_name || '',
      'SĐT':         s.phone || '',
      'Email':       s.email || '',
      'Ngày sinh':   s.date_of_birth || '',
      'Giới tính':   s.gender === 'nam' ? 'Nam' : s.gender === 'nu' ? 'Nữ' : 'Khác',
      'Địa chỉ':     s.address || '',
      'Trình độ':    s.level || '',
      'Học phí':     s.tuition_fee || 0,
      'Đã đóng':     s.tuition_paid ? 'Đã đóng' : 'Chưa đóng',
      'Trạng thái':  STATUS_LABELS[s.status]?.label || s.status,
      'Ghi chú':     s.note || '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Học viên')

    worksheet['!cols'] = [
      { wch: 5 },  { wch: 20 }, { wch: 13 }, { wch: 22 },
      { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 25 },
    ]

    const today = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')
    XLSX.writeFile(workbook, `Danh_sach_hoc_vien_${today}.xlsx`)
  }

  function StudentActionButton({ student }) {
    const hasClass = studentClassStatus[student.id] || false
    return (
      <button
        onClick={() => openClassModal(student)}
        style={{
          padding: isMobile ? '4px 10px' : '4px 12px',
          fontSize: isMobile ? '10px' : '11px',
          borderRadius: '6px',
          fontWeight: 500,
          border: 'none',
          cursor: 'pointer',
          background: hasClass ? '#9ca3af' : '#2563eb',
          color: 'white',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <School size={isMobile ? 12 : 14} />
        {hasClass ? 'Xem lớp' : 'Xếp lớp'}
      </button>
    )
  }

  // Render mobile card - ĐƠN GIẢN: Tên, Trình độ, Ô tick, Nút xem chi tiết
  const renderMobileCard = (student) => {
    return (
      <div key={student.id} style={{
        background: 'white',
        borderRadius: '8px',
        padding: '14px',
        marginBottom: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #f3f4f6'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '16px', color: '#1f2937' }}>
              {student.full_name}
            </div>
            <div style={{ 
              fontSize: '13px', 
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '2px'
            }}>
              <BookOpen size={14} />
              {student.level || 'Chưa có trình độ'}
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[student.status]?.color}`}>
            {STATUS_LABELS[student.status]?.label}
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid #f3f4f6'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'pointer',
            fontSize: '13px',
            color: student.tuition_paid ? '#16a34a' : '#6b7280'
          }}>
            <input
              type="checkbox"
              checked={student.tuition_paid || false}
              onChange={() => toggleTuitionPaid(student)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            {student.tuition_paid ? (
              <CheckCircle size={16} color="#16a34a" />
            ) : (
              <XCircle size={16} color="#9ca3af" />
            )}
            <span>{student.tuition_paid ? 'Đã đóng học phí' : 'Chưa đóng học phí'}</span>
          </label>

          <button
            onClick={() => openDetailModal(student)}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500
            }}
          >
            <Eye size={14} />
            Xem chi tiết
          </button>
        </div>
      </div>
    )
  }

  // Mobile Detail Modal
  const renderDetailModal = () => {
    if (!detailStudent) return null
    
    const hasClass = studentClassStatus[detailStudent.id] || false
    
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 100,
        animation: 'slideUp 0.3s ease'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px 16px 0 0',
          width: '100%',
          maxHeight: '80vh',
          padding: '20px 16px 30px',
          overflowY: 'auto',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.2)'
        }}>
          {/* Drag handle */}
          <div style={{
            width: '40px',
            height: '4px',
            background: '#d1d5db',
            borderRadius: '2px',
            margin: '0 auto 16px'
          }} />
          
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                {detailStudent.full_name}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[detailStudent.status]?.color}`}>
                {STATUS_LABELS[detailStudent.status]?.label}
              </span>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Thông tin chi tiết */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '16px'
          }}>
            <div style={{
              padding: '10px 12px',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>📱 SĐT</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                {detailStudent.phone || '—'}
              </div>
            </div>
            <div style={{
              padding: '10px 12px',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>📧 Email</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                {detailStudent.email || '—'}
              </div>
            </div>
            <div style={{
              padding: '10px 12px',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>🎂 Ngày sinh</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                {detailStudent.date_of_birth || '—'}
              </div>
            </div>
            <div style={{
              padding: '10px 12px',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>🚻 Giới tính</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                {detailStudent.gender === 'nam' ? 'Nam' : detailStudent.gender === 'nu' ? 'Nữ' : 'Khác'}
              </div>
            </div>
            <div style={{
              padding: '10px 12px',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>📚 Trình độ</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                {detailStudent.level || '—'}
              </div>
            </div>
            <div style={{
              padding: '10px 12px',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>🏠 Địa chỉ</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                {detailStudent.address || '—'}
              </div>
            </div>
            <div style={{
              padding: '10px 12px',
              background: '#f9fafb',
              borderRadius: '8px',
              gridColumn: '1/3'
            }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>💰 Học phí</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                {detailStudent.tuition_fee ? Number(detailStudent.tuition_fee).toLocaleString('vi-VN') + 'đ' : '—'}
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: 400, 
                  color: detailStudent.tuition_paid ? '#16a34a' : '#ef4444',
                  marginLeft: '8px'
                }}>
                  {detailStudent.tuition_paid ? 'Đã đóng' : 'Chưa đóng'}
                </span>
              </div>
            </div>
            {detailStudent.note && (
              <div style={{
                padding: '10px 12px',
                background: '#f9fafb',
                borderRadius: '8px',
                gridColumn: '1/3'
              }}>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>📝 Ghi chú</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                  {detailStudent.note}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => {
                setShowDetailModal(false)
                editStudent(detailStudent)
              }}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '14px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontWeight: 500
              }}
            >
              <Edit size={16} />
              Sửa
            </button>
            <button
              onClick={() => {
                setShowDetailModal(false)
                openClassModal(detailStudent)
              }}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '14px',
                background: hasClass ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontWeight: 500
              }}
            >
              <School size={16} />
              {hasClass ? 'Xem lớp' : 'Xếp lớp'}
            </button>
          </div>
          <button
            onClick={() => {
              if (confirm(`Xoá học viên "${detailStudent.full_name}"?`)) {
                setShowDetailModal(false)
                deleteStudent(detailStudent.id)
              }
            }}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '8px',
              fontSize: '14px',
              background: 'none',
              color: '#ef4444',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontWeight: 500
            }}
          >
            <Trash2 size={16} />
            Xoá học viên
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
            Quản lý Học viên
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
            Tổng số: {students.length} học viên
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          <button
            onClick={exportToExcel}
            style={{
              padding: isMobile ? '8px 16px' : '8px 20px',
              fontSize: isMobile ? '13px' : '14px',
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              flex: isMobile ? 1 : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileSpreadsheet size={16} />
            Xuất Excel
          </button>
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
              flex: isMobile ? 1 : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} />
            Thêm học viên
          </button>
        </div>
      </div>

      {/* Search & Filter */}
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

      {/* Mobile View - Đơn giản */}
      {isMobile ? (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
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
              <p style={{ color: '#6b7280' }}>Chưa có học viên nào</p>
              <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
                {search || filterStatus ? 'Không tìm thấy kết quả phù hợp' : 'Hãy thêm học viên mới'}
              </p>
            </div>
          ) : (
            filtered.map(student => renderMobileCard(student))
          )}
        </div>
      ) : (
        /* Desktop View - Giữ nguyên */
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                {['Họ tên','SĐT','Trình độ','Học phí','Đã đóng','Trạng thái','Thao tác'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid #f3f4f6' }}>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                  <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                  <p>Đang tải...</p>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                  Chưa có học viên nào
                </td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontWeight: 500, color: '#1f2937', margin: 0 }}>{s.full_name}</p>
                    {s.email && <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{s.email}</p>}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{s.phone}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{s.level || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#1f2937', fontWeight: 500 }}>
                    {s.tuition_fee ? Number(s.tuition_fee).toLocaleString('vi-VN') + 'đ' : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={s.tuition_paid || false}
                        onChange={() => toggleTuitionPaid(s)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: 500, color: s.tuition_paid ? '#16a34a' : '#9ca3af' }}>
                        {s.tuition_paid ? 'Đã đóng' : 'Chưa đóng'}
                      </span>
                    </label>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[s.status]?.color}`}>
                      {STATUS_LABELS[s.status]?.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <StudentActionButton student={s} />
                      <button
                        onClick={() => editStudent(s)}
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
                        <Edit size={14} />
                        Sửa
                      </button>
                      <button
                        onClick={() => deleteStudent(s.id)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          background: 'none',
                          color: '#ef4444',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={14} />
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

      {/* Mobile Detail Modal */}
      {showDetailModal && renderDetailModal()}

      {/* Class Modal - Giữ nguyên */}
      {showClassModal && selectedStudent && (
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
            width: isMobile ? '100%' : '448px',
            maxWidth: '500px',
            padding: isMobile ? '20px 16px' : '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: '#1f2937', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <School size={20} color="#2563eb" />
              Xếp lớp cho học viên
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              Học viên: <span style={{ fontWeight: 500, color: '#1f2937' }}>{selectedStudent.full_name}</span>
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Chọn lớp học</label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: isMobile ? '14px' : '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              >
                <option value="">-- Chọn lớp --</option>
                {classList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {classList.length === 0 && (
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Chưa có lớp học nào đang hoạt động</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={assignStudentToClass}
                disabled={assigning}
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
                  opacity: assigning ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {assigning ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <UserPlus size={16} />
                )}
                {assigning ? 'Đang xếp...' : 'Xếp lớp'}
              </button>
              <button
                onClick={() => { setShowClassModal(false); setSelectedStudent(null); setSelectedClass('') }}
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

      {/* View Class Modal - Giữ nguyên */}
      {showViewClassModal && selectedStudent && (
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
            width: isMobile ? '100%' : '448px',
            maxWidth: '500px',
            padding: isMobile ? '20px 16px' : '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <School size={20} color="#2563eb" />
                  Lớp đã xếp
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  Học viên: <span style={{ fontWeight: 500, color: '#1f2937' }}>{selectedStudent.full_name}</span>
                </p>
              </div>
              <button
                onClick={() => { setShowViewClassModal(false); setSelectedStudent(null); setStudentClasses([]) }}
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

            {loadingStudentClasses ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px 0' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p>Đang tải...</p>
              </p>
            ) : studentClasses.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px 0' }}>Chưa có lớp nào</p>
            ) : (
              <div style={{ marginBottom: '16px' }}>
                {studentClasses.map(cs => (
                  <div key={cs.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <p style={{ fontWeight: 500, color: '#1f2937', fontSize: '14px', margin: 0 }}>
                        {cs.classes?.name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>
                        {cs.classes?.status === 'dang_hoc' ? 'Đang học' : 'Khác'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setShowViewClassModal(false)
                          setSelectedStudent(null)
                          setStudentClasses([])
                          navigate(`/classes?highlight=${cs.class_id}`)
                        }}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          color: '#3b82f6',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Eye size={14} />
                        Xem lớp
                      </button>
                      <button
                        onClick={() => removeStudentFromClass(cs.id)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          color: '#ef4444',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={14} />
                        Xoá
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setShowViewClassModal(false); setShowClassModal(true); fetchClasses() }}
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={16} />
                Xếp thêm lớp
              </button>
              <button
                onClick={() => { setShowViewClassModal(false); setSelectedStudent(null); setStudentClasses([]); fetchStudents() }}
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
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal - Giữ nguyên */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                    Cập nhật học viên
                  </>
                ) : (
                  <>
                    <UserPlus size={20} color="#2563eb" />
                    Thêm học viên mới
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
                  type="date"
                  value={form.date_of_birth}
                  onChange={e => setForm({...form, date_of_birth: e.target.value})}
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Giới tính</label>
                <select
                  value={form.gender}
                  onChange={e => setForm({...form, gender: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                  <option value="khac">Khác</option>
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Địa chỉ</label>
                <input
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Học phí</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={form.tuition_fee}
                    onChange={e => setForm({...form, tuition_fee: e.target.value})}
                    placeholder="VD: 3500000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      paddingRight: '40px',
                      fontSize: isMobile ? '14px' : '14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '8px', color: '#9ca3af', fontSize: '14px' }}>đ</span>
                </div>
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1/3' }}>
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
                onClick={saveStudent}
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
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Save size={16} />
                )}
                {saving ? 'Đang lưu...' : 'Lưu'}
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
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}
      </style>
    </div>
  )
}