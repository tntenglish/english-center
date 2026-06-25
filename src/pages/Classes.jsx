import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
  const [classes, setClasses]   = useState([])
  const [courses, setCourses]   = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  // State cho modal danh sách học viên
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
      // Kiểm tra học viên đã có trong lớp chưa
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
    
    // Kiểm tra xem lớp có học viên không
    const { data: students } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', id)
    
    if (students && students.length > 0) {
      if (!confirm('Lớp này đang có học viên. Xoá sẽ xoá luôn danh sách học viên trong lớp. Tiếp tục?')) return
      // Xóa tất cả học viên trong lớp
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Quản lý Lớp học</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tổng số: {classes.length} lớp</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowForm(true) }}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Thêm lớp
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Tìm tên lớp..."
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
              {['Tên lớp','Khoá học','Giáo viên','Lịch học','Phòng','Sĩ số tối đa','Trạng thái','Thao tác'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Chưa có lớp nào</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.courses?.name || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.teachers?.full_name || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.schedule || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.room || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.max_students}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[c.status]?.color}`}>
                    {STATUS_LABELS[c.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    <button 
                      onClick={() => openStudentModal(c)} 
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition shadow-sm"
                    >
                      DS học viên
                    </button>
                    <button 
                      onClick={() => editClass(c)} 
                      className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1"
                    >
                      Sửa
                    </button>
                    <button 
                      onClick={() => deleteClass(c.id)} 
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

      {/* Modal Danh sách học viên */}
      {showStudentModal && selectedClass && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  Danh sách học viên
                </h3>
                <p className="text-sm text-gray-500">
                  Lớp: <span className="font-medium text-gray-700">{selectedClass.name}</span>
                  {selectedClass.teacher_id && teachersMap[selectedClass.teacher_id] && (
                    <span className="ml-3">
                      Giáo viên: <span className="font-medium text-gray-700">{teachersMap[selectedClass.teacher_id]}</span>
                    </span>
                  )}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowStudentModal(false)
                  setSelectedClass(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Thêm học viên */}
            <div className="flex gap-2 mb-4">
              <select 
                value={selectedStudentId} 
                onChange={e => setSelectedStudentId(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="">-- Chọn học viên để thêm --</option>
                {allStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} - {s.phone}</option>
                ))}
              </select>
              <button 
                onClick={addStudentToClass} 
                disabled={addingStudent}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 whitespace-nowrap"
              >
                {addingStudent ? 'Đang thêm...' : '+ Thêm'}
              </button>
            </div>

            {/* Danh sách học viên */}
            <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">STT</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Họ tên</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">SĐT</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingStudents ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Đang tải...</td></tr>
                  ) : classStudents.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Chưa có học viên nào trong lớp</td></tr>
                  ) : (
                    classStudents.map((cs, index) => (
                      <tr key={cs.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-2 text-gray-500">{index + 1}</td>
                        <td className="px-4 py-2 font-medium text-gray-800">
                          {cs.students?.full_name || '—'}
                        </td>
                        <td className="px-4 py-2 text-gray-500">
                          {cs.students?.phone || '—'}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button 
                            onClick={() => removeStudentFromClass(cs.id, cs.students?.full_name || 'học viên')}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            Xoá
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-right">
              <button 
                onClick={() => {
                  setShowStudentModal(false)
                  setSelectedClass(null)
                }}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Thêm/Sửa lớp */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {form.id ? 'Cập nhật lớp học' : 'Thêm lớp học mới'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tên lớp *</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="VD: IELTS-B1-Sáng T2T4T6"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Khoá học</label>
                  <select 
                    value={form.course_id} 
                    onChange={e => setForm({...form, course_id: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  >
                    <option value="">-- Chọn khoá --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Giáo viên</label>
                  <select 
                    value={form.teacher_id} 
                    onChange={e => setForm({...form, teacher_id: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  >
                    <option value="">-- Chọn GV --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Phòng học</label>
                  <input 
                    value={form.room} 
                    onChange={e => setForm({...form, room: e.target.value})}
                    placeholder="VD: Phòng 101"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Sĩ số tối đa</label>
                  <input 
                    type="number" 
                    value={form.max_students} 
                    onChange={e => setForm({...form, max_students: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" 
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Lịch học</label>
                <input 
                  value={form.schedule} 
                  onChange={e => setForm({...form, schedule: e.target.value})}
                  placeholder="VD: T2, T4, T6 — 8:00–9:30"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ngày khai giảng</label>
                  <input 
                    type="date" 
                    value={form.start_date} 
                    onChange={e => setForm({...form, start_date: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ngày kết thúc</label>
                  <input 
                    type="date" 
                    value={form.end_date} 
                    onChange={e => setForm({...form, end_date: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" 
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Trạng thái</label>
                <select 
                  value={form.status} 
                  onChange={e => setForm({...form, status: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                >
                  {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ghi chú</label>
                <textarea 
                  value={form.note} 
                  onChange={e => setForm({...form, note: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" 
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button 
                onClick={saveClass} 
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button 
                onClick={() => {
                  setShowForm(false)
                  setForm(EMPTY_FORM)
                }}
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