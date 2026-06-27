import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'

const STATUS_LABELS = {
  cho_khai_giang: { label: 'Chờ khai giảng', color: 'bg-yellow-100 text-yellow-700' },
  dang_hoc:       { label: 'Đang học',        color: 'bg-green-100 text-green-700' },
  ket_thuc:       { label: 'Kết thúc',        color: 'bg-gray-100 text-gray-600' },
  huy:            { label: 'Huỷ',             color: 'bg-red-100 text-red-700' },
}

const EMPTY_FORM = {
  name: '', course_id: '', teacher_id: '', room: '',
  max_students: 15, schedule: '', start_date: '',
  end_date: '', status: 'cho_khai_giang', note: '',
}

export default function Classes() {
  const isMobile = useIsMobile()
  const [classes, setClasses]   = useState([])
  const [courses, setCourses]   = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [classStudents, setClassStudents] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [addingStudent, setAddingStudent] = useState(false)
  const [teachersMap, setTeachersMap] = useState({})

  useEffect(() => {
    fetchAll()
    fetchTeachersMap()
  }, [])

  async function fetchTeachersMap() {
    const { data } = await supabase
      .from('teachers')
      .select('id, full_name')
    const map = {}
    data?.forEach(t => {
      map[t.id] = t.full_name
    })
    setTeachersMap(map)
  }

  async function fetchAll() {
    setLoading(true)
    try {
      const [c, t, cl] = await Promise.all([
        supabase.from('courses').select('id, name'),
        supabase.from('teachers').select('id, full_name'),
        supabase.from('classes').select(`
          *, 
          courses(name), 
          teachers(full_name)
        `).order('created_at', { ascending: false }),
      ])
      
      setCourses(c.data || [])
      setTeachers(t.data || [])
      setClasses(cl.data || [])
    } catch (error) {
      console.error('Lỗi fetchAll:', error)
    }
    setLoading(false)
  }

  async function fetchAllStudents() {
    const { data } = await supabase
      .from('students')
      .select('id, full_name, phone, status')
      .eq('status', 'dang_hoc')
    setAllStudents(data || [])
  }

  async function fetchClassStudents(classId) {
    setLoadingStudents(true)
    try {
      const { data } = await supabase
        .from('class_students')
        .select(`
          id,
          student_id,
          students(id, full_name, phone)
        `)
        .eq('class_id', classId)
      
      setClassStudents(data || [])
    } catch (error) {
      console.error('Lỗi fetch class students:', error)
    }
    setLoadingStudents(false)
  }

  async function openStudentModal(classItem) {
    setSelectedClass(classItem)
    setShowStudentModal(true)
    await fetchAllStudents()
    await fetchClassStudents(classItem.id)
    setSelectedStudentId('')
  }

  async function addStudentToClass() {
    if (!selectedStudentId) {
      alert('Vui lòng chọn học viên!')
      return
    }
    
    setAddingStudent(true)
    
    try {
      const { data: existing } = await supabase
        .from('class_students')
        .select('*')
        .eq('class_id', selectedClass.id)
        .eq('student_id', selectedStudentId)
      
      if (existing && existing.length > 0) {
        alert('⚠️ Học viên này đã có trong lớp!')
        setAddingStudent(false)
        return
      }
      
      const { error } = await supabase
        .from('class_students')
        .insert({
          class_id: selectedClass.id,
          student_id: selectedStudentId
        })
      
      if (error) {
        console.error('Lỗi thêm học viên:', error)
        alert(`Lỗi: ${error.message}`)
      } else {
        alert('✅ Đã thêm học viên vào lớp!')
        await fetchClassStudents(selectedClass.id)
        setSelectedStudentId('')
      }
      
    } catch (error) {
      console.error('Lỗi:', error)
      alert(`Có lỗi xảy ra: ${error.message}`)
    }
    
    setAddingStudent(false)
  }

  async function removeStudentFromClass(classStudentId, studentName) {
    if (!confirm(`Xoá học viên "${studentName}" khỏi lớp này?`)) return
    
    const { error } = await supabase
      .from('class_students')
      .delete()
      .eq('id', classStudentId)
    
    if (error) {
      console.error('Lỗi xóa học viên khỏi lớp:', error)
      alert(`Lỗi: ${error.message}`)
    } else {
      alert('✅ Đã xóa học viên khỏi lớp!')
      await fetchClassStudents(selectedClass.id)
    }
  }

  async function saveClass() {
    if (!form.name) {
      alert('Vui lòng nhập tên lớp!')
      return
    }
    
    setSaving(true)
    
    try {
      const payload = {
        name: form.name.trim(),
        course_id: form.course_id || null,
        teacher_id: form.teacher_id || null,
        room: form.room || '',
        max_students: parseInt(form.max_students) || 15,
        schedule: form.schedule || '',
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status || 'cho_khai_giang',
        note: form.note || ''
      }
      
      let result
      if (form.id) {
        result = await supabase.from('classes').update(payload).eq('id', form.id)
      } else {
        result = await supabase.from('classes').insert(payload)
      }
      
      if (result.error) {
        console.error('❌ Lỗi:', result.error)
        alert(`Lỗi khi lưu: ${result.error.message}`)
        setSaving(false)
        return
      }
      
      setSaving(false)
      setShowForm(false)
      setForm(EMPTY_FORM)
      await fetchAll()
      await fetchTeachersMap()
      alert(form.id ? '✅ Đã cập nhật lớp học thành công!' : '✅ Đã thêm lớp học thành công!')
      
    } catch (error) {
      console.error('💥 Lỗi:', error)
      alert(`Có lỗi xảy ra: ${error.message}`)
      setSaving(false)
    }
  }

  async function deleteClass(id) {
    if (!confirm('Xoá lớp học này?')) return
    
    const { data: students } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', id)
    
    if (students && students.length > 0) {
      if (!confirm('Lớp này đang có học viên. Xoá sẽ xoá luôn danh sách học viên trong lớp. Tiếp tục?')) return
      await supabase
        .from('class_students')
        .delete()
        .eq('class_id', id)
    }
    
    const { error } = await supabase.from('classes').delete().eq('id', id)
    if (error) {
      alert(`Lỗi xóa: ${error.message}`)
    } else {
      await fetchAll()
      alert('✅ Đã xóa lớp học!')
    }
  }

  function editClass(classItem) {
    setForm({
      id: classItem.id,
      name: classItem.name || '',
      course_id: classItem.course_id || '',
      teacher_id: classItem.teacher_id || '',
      room: classItem.room || '',
      max_students: classItem.max_students || 15,
      schedule: classItem.schedule || '',
      start_date: classItem.start_date || '',
      end_date: classItem.end_date || '',
      status: classItem.status || 'cho_khai_giang',
      note: classItem.note || ''
    })
    setShowForm(true)
  }

  const filtered = classes.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus ? c.status === filterStatus : true
    return matchSearch && matchStatus
  })

  const renderMobileCard = (classItem) => (
    <div key={classItem.id} style={{
      background: 'white',
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #f3f4f6'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '15px', color: '#1f2937' }}>
            {classItem.name}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            📚 {classItem.courses?.name || '—'}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[classItem.status]?.color}`}>
          {STATUS_LABELS[classItem.status]?.label}
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
        <div>👨‍🏫 {classItem.teachers?.full_name || '—'}</div>
        <div>🏫 {classItem.room || '—'}</div>
        <div>📅 {classItem.schedule || '—'}</div>
        <div>👥 {classItem.max_students}</div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => openStudentModal(classItem)} 
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '11px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          📋 DS học viên
        </button>
        <button 
          onClick={() => editClass(classItem)} 
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
          onClick={() => deleteClass(classItem.id)} 
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
            Quản lý Lớp học
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
            Tổng số: {classes.length} lớp
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
          + Thêm lớp
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '8px' : '12px',
        marginBottom: '16px'
      }}>
        <input
          placeholder="Tìm tên lớp..."
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
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Chưa có lớp nào</div>
          ) : (
            filtered.map(classItem => renderMobileCard(classItem))
          )}
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                {['Tên lớp','Khoá học','Giáo viên','Lịch học','Phòng','Sĩ số','Trạng thái','Thao tác'].map(h => (
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
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Chưa có lớp nào</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#1f2937' }}>{c.name}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{c.courses?.name || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{c.teachers?.full_name || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{c.schedule || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{c.room || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{c.max_students}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[c.status]?.color}`}>
                      {STATUS_LABELS[c.status]?.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => openStudentModal(c)} 
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          background: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        DS học viên
                      </button>
                      <button 
                        onClick={() => editClass(c)} 
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
                        onClick={() => deleteClass(c.id)} 
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

      {showStudentModal && selectedClass && (
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
            width: isMobile ? '100%' : '672px',
            maxWidth: '700px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: isMobile ? '20px 16px' : '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                  Danh sách học viên
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  Lớp: <span style={{ fontWeight: 500, color: '#1f2937' }}>{selectedClass.name}</span>
                  {selectedClass.teacher_id && teachersMap[selectedClass.teacher_id] && (
                    <span style={{ marginLeft: '12px' }}>
                      Giáo viên: <span style={{ fontWeight: 500, color: '#1f2937' }}>{teachersMap[selectedClass.teacher_id]}</span>
                    </span>
                  )}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowStudentModal(false)
                  setSelectedClass(null)
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

            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <select 
                value={selectedStudentId} 
                onChange={e => setSelectedStudentId(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: isMobile ? '14px' : '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                <option value="">-- Chọn học viên để thêm --</option>
                {allStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} - {s.phone}</option>
                ))}
              </select>
              <button 
                onClick={addStudentToClass} 
                disabled={addingStudent}
                style={{
                  padding: isMobile ? '8px 16px' : '8px 20px',
                  fontSize: isMobile ? '13px' : '14px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: addingStudent ? 0.6 : 1,
                  whiteSpace: 'nowrap'
                }}
              >
                {addingStudent ? 'Đang thêm...' : '+ Thêm'}
              </button>
            </div>

            <div style={{
              flex: 1,
              overflow: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              {isMobile ? (
                <div style={{ padding: '12px' }}>
                  {loadingStudents ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>Đang tải...</div>
                  ) : classStudents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>Chưa có học viên nào</div>
                  ) : (
                    classStudents.map((cs, index) => (
                      <div key={cs.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: index < classStudents.length - 1 ? '1px solid #f3f4f6' : 'none'
                      }}>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '14px', color: '#1f2937' }}>
                            {cs.students?.full_name || '—'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {cs.students?.phone || '—'}
                          </div>
                        </div>
                        <button 
                          onClick={() => removeStudentFromClass(cs.id, cs.students?.full_name || 'học viên')}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            color: '#ef4444',
                            background: 'none',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Xoá
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>STT</th>
                      <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Họ tên</th>
                      <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>SĐT</th>
                      <th style={{ textAlign: 'center', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody style={{ borderTop: '1px solid #f3f4f6' }}>
                    {loadingStudents ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>Đang tải...</td></tr>
                    ) : classStudents.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>Chưa có học viên nào</td></tr>
                    ) : (
                      classStudents.map((cs, index) => (
                        <tr key={cs.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px 16px', color: '#6b7280' }}>{index + 1}</td>
                          <td style={{ padding: '8px 16px', fontWeight: 500, color: '#1f2937' }}>
                            {cs.students?.full_name || '—'}
                          </td>
                          <td style={{ padding: '8px 16px', color: '#6b7280' }}>
                            {cs.students?.phone || '—'}
                          </td>
                          <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                            <button 
                              onClick={() => removeStudentFromClass(cs.id, cs.students?.full_name || 'học viên')}
                              style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                color: '#ef4444',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              Xoá
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button 
                onClick={() => {
                  setShowStudentModal(false)
                  setSelectedClass(null)
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
              {form.id ? 'Cập nhật lớp học' : 'Thêm lớp học mới'}
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? '10px' : '12px'
            }}>
              <div style={{ gridColumn: isMobile ? '1' : '1/3' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tên lớp *</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="VD: IELTS-B1-Sáng T2T4T6"
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Khoá học</label>
                <select 
                  value={form.course_id} 
                  onChange={e => setForm({...form, course_id: e.target.value})}
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
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Giáo viên</label>
                <select 
                  value={form.teacher_id} 
                  onChange={e => setForm({...form, teacher_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Chọn GV --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Phòng học</label>
                <input 
                  value={form.room} 
                  onChange={e => setForm({...form, room: e.target.value})}
                  placeholder="VD: Phòng 101"
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Sĩ số tối đa</label>
                <input 
                  type="number" 
                  value={form.max_students} 
                  onChange={e => setForm({...form, max_students: e.target.value})}
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Lịch học</label>
                <input 
                  value={form.schedule} 
                  onChange={e => setForm({...form, schedule: e.target.value})}
                  placeholder="VD: T2, T4, T6 — 8:00–9:30"
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Ngày khai giảng</label>
                <input 
                  type="date" 
                  value={form.start_date} 
                  onChange={e => setForm({...form, start_date: e.target.value})}
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Ngày kết thúc</label>
                <input 
                  type="date" 
                  value={form.end_date} 
                  onChange={e => setForm({...form, end_date: e.target.value})}
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
                onClick={saveClass} 
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
                onClick={() => {
                  setShowForm(false)
                  setForm(EMPTY_FORM)
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
    </div>
  )
}