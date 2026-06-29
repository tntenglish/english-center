// src/pages/Attendance.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  ChevronRight,
  UserCheck,
  UserX,
  AlertCircle,
  BarChart3,
  Save,
  ChevronLeft,
  School,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

const STATUS_LABELS = {
  co_mat: { label: 'Có mặt', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  vang:   { label: 'Vắng',   color: 'bg-red-100 text-red-700', icon: XCircle },
  tre:    { label: 'Trễ',    color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  phep:   { label: 'Phép',   color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
}

export default function Attendance() {
  const isMobile = useIsMobile()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  
  const [showStats, setShowStats] = useState(false)
  const [statsData, setStatsData] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => { 
    fetchClasses() 
  }, [])

  useEffect(() => {
    if (selectedClass && sessionDate) {
      fetchStudentsAndAttendance()
    }
  }, [selectedClass, sessionDate])

  async function fetchClasses() {
    setInitialLoading(true)
    setError(null)
    
    try {
      console.log('📚 Đang lấy danh sách lớp học...')
      
      // Lấy TẤT CẢ lớp học, không lọc status
      const { data, error: fetchError } = await supabase
        .from('classes')
        .select('*')
        .order('name')
      
      if (fetchError) {
        console.error('❌ Lỗi khi lấy danh sách lớp:', fetchError)
        setError(`Lỗi: ${fetchError.message}`)
        setClasses([])
        setInitialLoading(false)
        return
      }
      
      console.log('📊 Dữ liệu lớp học nhận được:', data)
      console.log('📊 Số lượng lớp học:', data?.length || 0)
      
      if (!data || data.length === 0) {
        console.warn('⚠️ Không tìm thấy lớp học nào trong database!')
        setClasses([])
        setInitialLoading(false)
        return
      }
      
      // Hiển thị tất cả lớp, không lọc status
      // Hoặc nếu muốn lọc, có thể hiển thị cả lớp 'cho_khai_giang' và 'dang_hoc'
      const activeClasses = data.filter(cls => 
        cls.status === 'dang_hoc' || 
        cls.status === 'cho_khai_giang' ||
        cls.status === null ||
        cls.status === undefined
      )
      
      console.log('✅ Lớp học active (sau khi lọc):', activeClasses)
      
      // Nếu không có lớp active, hiển thị tất cả
      if (activeClasses.length === 0) {
        console.warn('⚠️ Không có lớp nào với status dang_hoc hoặc cho_khai_giang, hiển thị tất cả')
        setClasses(data)
      } else {
        setClasses(activeClasses)
      }
      
    } catch (error) {
      console.error('💥 Lỗi fetchClasses:', error)
      setError(`Có lỗi xảy ra: ${error.message}`)
      setClasses([])
    }
    
    setInitialLoading(false)
  }

  async function fetchStudentsAndAttendance() {
    setLoading(true)
    setSaved(false)
    setError(null)

    try {
      const { data: classStudents, error: csError } = await supabase
        .from('class_students')
        .select(`
          id,
          student_id,
          students(id, full_name, phone)
        `)
        .eq('class_id', selectedClass)

      if (csError) {
        console.error('Lỗi lấy danh sách học viên:', csError)
        setError(`Lỗi: ${csError.message}`)
        setLoading(false)
        return
      }

      if (!classStudents || classStudents.length === 0) {
        setStudents([])
        setAttendance({})
        setLoading(false)
        return
      }

      const studentIds = classStudents.map(cs => cs.student_id)

      const { data: attData, error: attError } = await supabase
        .from('attendance')
        .select('student_id, status, note')
        .eq('class_id', selectedClass)
        .eq('session_date', sessionDate)
        .in('student_id', studentIds)

      if (attError) {
        console.error('Lỗi lấy điểm danh:', attError)
      }

      const attMap = {}
      if (attData) {
        attData.forEach(a => {
          attMap[a.student_id] = { status: a.status, note: a.note || '' }
        })
      }

      const studentList = classStudents.map(cs => cs.students)
      studentList.forEach(s => {
        if (!attMap[s.id]) {
          attMap[s.id] = { status: 'co_mat', note: '' }
        }
      })

      setStudents(studentList)
      setAttendance(attMap)
      
    } catch (error) {
      console.error('Lỗi fetchStudentsAndAttendance:', error)
      setError(`Có lỗi xảy ra: ${error.message}`)
    }
    
    setLoading(false)
  }

  async function fetchAttendanceStats() {
    if (!selectedClass) {
      alert('Vui lòng chọn lớp!')
      return
    }
    
    setLoadingStats(true)
    setShowStats(true)

    try {
      const { data: classStudents } = await supabase
        .from('class_students')
        .select(`
          id,
          student_id,
          students(id, full_name, phone)
        `)
        .eq('class_id', selectedClass)

      if (!classStudents || classStudents.length === 0) {
        setStatsData([])
        setLoadingStats(false)
        return
      }

      const studentIds = classStudents.map(cs => cs.student_id)

      const { data: allAttendance } = await supabase
        .from('attendance')
        .select('student_id, status, session_date')
        .eq('class_id', selectedClass)
        .in('student_id', studentIds)
        .order('session_date', { ascending: false })

      const stats = classStudents.map(cs => {
        const student = cs.students
        const studentAtt = allAttendance?.filter(a => a.student_id === student.id) || []
        
        const totalSessions = studentAtt.length
        const presentSessions = studentAtt.filter(a => a.status === 'co_mat' || a.status === 'tre').length
        const absentSessions = studentAtt.filter(a => a.status === 'vang').length
        const leaveSessions = studentAtt.filter(a => a.status === 'phep').length
        const lateSessions = studentAtt.filter(a => a.status === 'tre').length
        
        const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0

        return {
          student_id: student.id,
          full_name: student.full_name,
          phone: student.phone,
          totalSessions,
          presentSessions,
          absentSessions,
          leaveSessions,
          lateSessions,
          attendanceRate
        }
      })

      stats.sort((a, b) => b.attendanceRate - a.attendanceRate)
      setStatsData(stats)

    } catch (error) {
      console.error('Lỗi fetchAttendanceStats:', error)
      alert(`Có lỗi xảy ra: ${error.message}`)
    }

    setLoadingStats(false)
  }

  function setStatus(studentId, status) {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }))
  }

  function setNote(studentId, note) {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note }
    }))
  }

  async function saveAttendance() {
    if (!selectedClass || !sessionDate) return
    setSaving(true)

    try {
      const rows = students.map(s => {
        const att = attendance[s.id]
        return {
          student_id: s.id,
          class_id: selectedClass,
          session_date: sessionDate,
          status: att?.status || 'co_mat',
          note: att?.note || '',
        }
      })

      await supabase
        .from('attendance')
        .delete()
        .eq('class_id', selectedClass)
        .eq('session_date', sessionDate)

      const { error } = await supabase
        .from('attendance')
        .insert(rows)

      if (error) {
        console.error('Lỗi lưu điểm danh:', error)
        alert(`Lỗi lưu: ${error.message}`)
      } else {
        setSaved(true)
        alert('✅ Đã lưu điểm danh thành công!')
      }
      
    } catch (error) {
      console.error('Lỗi saveAttendance:', error)
      alert(`Có lỗi xảy ra: ${error.message}`)
    }
    
    setSaving(false)
  }

  const stats = {
    co_mat: Object.values(attendance).filter(a => a.status === 'co_mat').length,
    vang:   Object.values(attendance).filter(a => a.status === 'vang').length,
    tre:    Object.values(attendance).filter(a => a.status === 'tre').length,
    phep:   Object.values(attendance).filter(a => a.status === 'phep').length,
  }

  function getRateColor(rate) {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    if (rate >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  function getRateBg(rate) {
    if (rate >= 90) return 'bg-green-100'
    if (rate >= 70) return 'bg-yellow-100'
    if (rate >= 50) return 'bg-orange-100'
    return 'bg-red-100'
  }

  // Lọc lớp học theo từ khóa tìm kiếm
  const filteredClasses = classes.filter(cls =>
    cls.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderStatusButtons = (studentId, currentStatus) => {
    return (
      <div style={{
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap',
        marginTop: '4px'
      }}>
        {Object.entries(STATUS_LABELS).map(([k, v]) => {
          const Icon = v.icon
          return (
            <button
              key={k}
              onClick={() => setStatus(studentId, k)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '10px',
                borderRadius: '12px',
                fontWeight: 500,
                border: '1px solid',
                borderColor: currentStatus === k ? '#2563eb' : '#e5e7eb',
                background: currentStatus === k ? '#dbeafe' : 'white',
                color: currentStatus === k ? '#1d4ed8' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={12} />
              {v.label}
            </button>
          )
        })}
      </div>
    )
  }

  const renderMobileCard = (student) => {
    const currentStatus = attendance[student.id]?.status || 'co_mat'
    const currentNote = attendance[student.id]?.note || ''
    const StatusIcon = STATUS_LABELS[currentStatus]?.icon
    
    return (
      <div key={student.id} style={{
        background: 'white',
        borderRadius: '8px',
        padding: '14px',
        marginBottom: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #f3f4f6'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#1f2937' }}>
              {student.full_name}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {student.phone || '—'}
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${STATUS_LABELS[currentStatus]?.color}`}>
            {StatusIcon && <StatusIcon size={12} />}
            {STATUS_LABELS[currentStatus]?.label}
          </span>
        </div>

        {renderStatusButtons(student.id, currentStatus)}

        <div style={{ marginTop: '8px' }}>
          <input
            value={currentNote}
            onChange={ev => setNote(student.id, ev.target.value)}
            placeholder="Ghi chú..."
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>
    )
  }

  // Render danh sách lớp học dạng card
  const renderClassList = () => {
    if (filteredClasses.length === 0) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <School size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>
            {searchTerm ? 'Không tìm thấy lớp học nào' : 'Chưa có lớp học nào'}
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>
            {searchTerm 
              ? 'Hãy thử tìm kiếm với từ khóa khác' 
              : 'Hãy tạo lớp học mới trong tab "Lớp học"'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => window.location.href = '/classes'}
              style={{
                marginTop: '12px',
                padding: '8px 20px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Đến trang Lớp học
            </button>
          )}
        </div>
      )
    }

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '12px',
        marginTop: '12px'
      }}>
        {filteredClasses.map(cls => {
          // Đếm số học viên trong lớp
          const studentCount = cls.student_count || 0
          
          return (
            <div
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: selectedClass === cls.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedClass === cls.id ? '0 4px 12px rgba(37,99,235,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
                position: 'relative'
              }}
            >
              {selectedClass === cls.id && (
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#2563eb',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  ✓
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <School size={20} color={selectedClass === cls.id ? '#2563eb' : '#6b7280'} />
                  <h3 style={{ 
                    fontSize: '15px', 
                    fontWeight: 600, 
                    color: selectedClass === cls.id ? '#2563eb' : '#1f2937',
                    margin: 0
                  }}>
                    {cls.name || 'Chưa có tên'}
                  </h3>
                </div>
                <ChevronRight size={18} color={selectedClass === cls.id ? '#2563eb' : '#9ca3af'} />
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '16px',
                fontSize: '12px',
                color: '#6b7280',
                flexWrap: 'wrap'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={14} />
                  {studentCount} học viên
                </span>
                {cls.schedule && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} />
                    {cls.schedule}
                  </span>
                )}
                {cls.status && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 500,
                    background: cls.status === 'dang_hoc' ? '#dcfce7' : '#fef3c7',
                    color: cls.status === 'dang_hoc' ? '#16a34a' : '#d97706'
                  }}>
                    {cls.status === 'dang_hoc' ? '🟢 Đang học' : '📋 Chờ khai giảng'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
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
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 600, color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={isMobile ? 20 : 24} color="#2563eb" />
          Điểm danh
        </h2>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
          Ghi nhận chuyên cần theo buổi học
        </p>
      </div>

      {/* Tìm kiếm lớp học */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: isMobile ? '14px' : '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '10px' : '12px',
          alignItems: isMobile ? 'stretch' : 'center'
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
              type="text"
              placeholder="🔍 Tìm kiếm lớp học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                fontSize: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedClass && (
              <button
                onClick={() => {
                  setSelectedClass('')
                  setSearchTerm('')
                  setStudents([])
                  setAttendance({})
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  color: '#6b7280',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={16} />
                Quay lại
              </button>
            )}
            <button
              onClick={fetchClasses}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                color: '#6b7280',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RefreshCw size={14} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Hiển thị trạng thái loading hoặc lỗi */}
      {initialLoading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Đang tải danh sách lớp học...</p>
        </div>
      )}

      {error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          background: '#fef2f2',
          borderRadius: '12px',
          border: '1px solid #fecaca'
        }}>
          <AlertTriangle size={32} color="#ef4444" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#dc2626', fontWeight: 500 }}>Có lỗi xảy ra</p>
          <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>{error}</p>
          <button
            onClick={fetchClasses}
            style={{
              marginTop: '12px',
              padding: '8px 20px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Hiển thị danh sách lớp nếu chưa chọn và không có lỗi */}
      {!selectedClass && !initialLoading && !error && (
        <>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
              {filteredClasses.length} lớp học
            </p>
          </div>
          {renderClassList()}
        </>
      )}

      {/* Hiển thị điểm danh khi đã chọn lớp */}
      {selectedClass && !initialLoading && !error && (
        <>
          {/* Thông tin lớp đã chọn */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: isMobile ? '14px' : '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '10px' : '12px'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Lớp học
                </label>
                <div style={{
                  padding: '8px 12px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1f2937'
                }}>
                  {classes.find(c => c.id === selectedClass)?.name || 'Đang tải...'}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Ngày học</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
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
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <button
                  onClick={fetchAttendanceStats}
                  style={{
                    width: isMobile ? '100%' : 'auto',
                    padding: isMobile ? '8px 16px' : '8px 16px',
                    fontSize: isMobile ? '13px' : '14px',
                    background: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <BarChart3 size={16} />
                  Thống kê
                </button>
              </div>
            </div>
          </div>

          {/* Thống kê nhanh */}
          {students.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
              gap: isMobile ? '6px' : '12px',
              marginBottom: '16px'
            }}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => {
                const Icon = v.icon
                return (
                  <div key={k} style={{
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    padding: isMobile ? '10px' : '12px',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                      {stats[k]}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.color}`}>
                      {v.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Danh sách học viên */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} />
                {loading ? 'Đang tải...' : `${students.length} học viên`}
              </p>
              {saved && <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 500 }}>✓ Đã lưu</span>}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Đang tải danh sách...</div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>Lớp này chưa có học viên nào</p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>Hãy thêm học viên vào lớp trong tab "Lớp học"</p>
              </div>
            ) : (
              isMobile ? (
                <div style={{ padding: '12px' }}>
                  {students.map(student => renderMobileCard(student))}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', fontWeight: 500, color: '#6b7280' }}>Họ tên</th>
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', fontWeight: 500, color: '#6b7280' }}>SĐT</th>
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', fontWeight: 500, color: '#6b7280' }}>Trạng thái</th>
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', fontWeight: 500, color: '#6b7280' }}>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody style={{ borderTop: '1px solid #f3f4f6' }}>
                      {students.map(s => {
                        const currentStatus = attendance[s.id]?.status || 'co_mat'
                        const StatusIcon = STATUS_LABELS[currentStatus]?.icon
                        return (
                          <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '10px 16px', fontWeight: 500, color: '#1f2937' }}>
                              {s.full_name}
                            </td>
                            <td style={{ padding: '10px 16px', color: '#6b7280', fontSize: '13px' }}>
                              {s.phone || '—'}
                            </td>
                            <td style={{ padding: '10px 16px' }}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {Object.entries(STATUS_LABELS).map(([k, v]) => {
                                  const Icon = v.icon
                                  const isActive = attendance[s.id]?.status === k
                                  return (
                                    <button
                                      key={k}
                                      onClick={() => setStatus(s.id, k)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        fontSize: '11px',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontWeight: 500,
                                        border: '1px solid',
                                        borderColor: isActive ? '#2563eb' : '#e5e7eb',
                                        background: isActive ? '#dbeafe' : 'white',
                                        color: isActive ? '#1d4ed8' : '#6b7280',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                    >
                                      <Icon size={12} />
                                      {v.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </td>
                            <td style={{ padding: '10px 16px' }}>
                              <input
                                value={attendance[s.id]?.note || ''}
                                onChange={ev => setNote(s.id, ev.target.value)}
                                placeholder="Lý do vắng..."
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '12px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  width: '150px',
                                  outline: 'none'
                                }}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>

          {/* Nút lưu */}
          {students.length > 0 && (
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={saveAttendance}
                disabled={saving}
                style={{
                  width: isMobile ? '100%' : 'auto',
                  padding: isMobile ? '10px' : '8px 24px',
                  fontSize: isMobile ? '14px' : '14px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: saving ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  justifyContent: 'center'
                }}
              >
                <Save size={16} />
                {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal thống kê */}
      {showStats && (
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
            width: isMobile ? '100%' : '800px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: isMobile ? '20px 16px' : '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                  <BarChart3 size={20} style={{ display: 'inline', marginRight: '8px' }} />
                  Thống kê chuyên cần
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  Lớp: <span style={{ fontWeight: 500, color: '#1f2937' }}>
                    {classes.find(c => c.id === selectedClass)?.name || 'Chưa chọn lớp'}
                  </span>
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowStats(false)
                  setStatsData([])
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {loadingStats ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Đang tải dữ liệu...</div>
            ) : statsData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                <BarChart3 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>Chưa có dữ liệu điểm danh</p>
              </div>
            ) : (
              <div style={{
                flex: 1,
                overflow: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                {isMobile ? (
                  <div style={{ padding: '12px' }}>
                    {statsData.map((item, index) => (
                      <div key={item.student_id} style={{
                        padding: '12px',
                        borderBottom: index < statsData.length - 1 ? '1px solid #f3f4f6' : 'none'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937' }}>
                              {item.full_name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                              {item.phone || '—'}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full font-bold text-sm ${getRateBg(item.attendanceRate)} ${getRateColor(item.attendanceRate)}`}>
                            {item.attendanceRate}%
                          </span>
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#6b7280',
                          textAlign: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1f2937' }}>{item.totalSessions}</div>
                            <div>Tổng</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#16a34a' }}>{item.presentSessions}</div>
                            <div>Có mặt</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#ef4444' }}>{item.absentSessions}</div>
                            <div>Vắng</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#f59e0b' }}>{item.lateSessions}</div>
                            <div>Trễ</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>STT</th>
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Họ tên</th>
                        <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Tổng</th>
                        <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Có mặt</th>
                        <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Vắng</th>
                        <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Trễ</th>
                        <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Phép</th>
                        <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>% Đi học</th>
                      </tr>
                    </thead>
                    <tbody style={{ borderTop: '1px solid #f3f4f6' }}>
                      {statsData.map((item, index) => (
                        <tr key={item.student_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px 16px', color: '#6b7280', textAlign: 'center' }}>{index + 1}</td>
                          <td style={{ padding: '8px 16px', fontWeight: 500, color: '#1f2937' }}>{item.full_name}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'center', color: '#1f2937' }}>{item.totalSessions}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'center', color: '#16a34a', fontWeight: 500 }}>{item.presentSessions}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'center', color: '#ef4444', fontWeight: 500 }}>{item.absentSessions}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'center', color: '#f59e0b', fontWeight: 500 }}>{item.lateSessions}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'center', color: '#3b82f6', fontWeight: 500 }}>{item.leaveSessions}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                            <span className={`px-3 py-1 rounded-full font-bold text-sm ${getRateBg(item.attendanceRate)} ${getRateColor(item.attendanceRate)}`}>
                              {item.attendanceRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Tổng số: {statsData.length} học viên
              </div>
              <button 
                onClick={() => {
                  setShowStats(false)
                  setStatsData([])
                }}
                style={{
                  padding: '8px 24px',
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
    </div>
  )
}