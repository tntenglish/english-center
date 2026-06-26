import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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

  const filtered = students.filter(s => {
    const matchSearch = s.full_name?.toLowerCase().includes(search.toLowerCase())
      || s.phone?.includes(search)
    const matchStatus = filterStatus ? s.status === filterStatus : true
    return matchSearch && matchStatus
  })

  function StudentActionButton({ student }) {
    const hasClass = studentClassStatus[student.id] || false
    return (
      <button
        onClick={() => openClassModal(student)}
        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition shadow-sm ${
          hasClass
            ? 'bg-gray-400 hover:bg-gray-500 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {hasClass ? 'Xem lớp đã xếp' : 'Xếp lớp'}
      </button>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Quản lý Học viên</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tổng số: {students.length} học viên</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowForm(true) }}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Thêm học viên
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Họ tên','SĐT','Trình độ','Học phí','Đã đóng','Trạng thái','Thao tác'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Chưa có học viên nào</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{s.full_name}</p>
                  <p className="text-xs text-gray-400">{s.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                <td className="px-4 py-3 text-gray-500">{s.level || '—'}</td>
                <td className="px-4 py-3 text-gray-700 font-medium">
                  {s.tuition_fee ? Number(s.tuition_fee).toLocaleString('vi-VN') + 'đ' : '—'}
                </td>
                <td className="px-4 py-3">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.tuition_paid || false}
                      onChange={() => toggleTuitionPaid(s)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className={`ml-2 text-xs font-medium ${s.tuition_paid ? 'text-green-600' : 'text-gray-400'}`}>
                      {s.tuition_paid ? 'Đã đóng' : 'Chưa đóng'}
                    </span>
                  </label>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[s.status]?.color}`}>
                    {STATUS_LABELS[s.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    <StudentActionButton student={s} />
                    <button onClick={() => editStudent(s)}
                      className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1">Sửa</button>
                    <button onClick={() => deleteStudent(s.id)}
                      className="text-red-400 hover:text-red-600 text-xs px-2 py-1">Xoá</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Xếp lớp */}
      {showClassModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Xếp lớp cho học viên</h3>
            <p className="text-sm text-gray-500 mb-4">
              Học viên: <span className="font-medium text-gray-700">{selectedStudent.full_name}</span>
            </p>
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">Chọn lớp học</label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="">-- Chọn lớp --</option>
                {classList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {classList.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">Chưa có lớp học nào đang hoạt động</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={assignStudentToClass} disabled={assigning}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                {assigning ? 'Đang xếp...' : 'Xếp lớp'}
              </button>
              <button onClick={() => { setShowClassModal(false); setSelectedStudent(null); setSelectedClass('') }}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem lớp đã xếp */}
      {showViewClassModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Lớp đã xếp</h3>
                <p className="text-sm text-gray-500">
                  Học viên: <span className="font-medium text-gray-700">{selectedStudent.full_name}</span>
                </p>
              </div>
              <button
                onClick={() => { setShowViewClassModal(false); setSelectedStudent(null); setStudentClasses([]) }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >✕</button>
            </div>

            {loadingStudentClasses ? (
              <p className="text-center text-gray-400 py-4">Đang tải...</p>
            ) : studentClasses.length === 0 ? (
              <p className="text-center text-gray-400 py-4">Chưa có lớp nào</p>
            ) : (
              <div className="space-y-2 mb-4">
                {studentClasses.map(cs => (
                  <div key={cs.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{cs.classes?.name}</p>
                      <p className="text-xs text-gray-400">
                        {cs.classes?.status === 'dang_hoc' ? 'Đang học' : 'Khác'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowViewClassModal(false)
                          setSelectedStudent(null)
                          setStudentClasses([])
                          navigate(`/classes?highlight=${cs.class_id}`)
                        }}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                      >
                        Xem lớp
                      </button>
                      <button
                        onClick={() => removeStudentFromClass(cs.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { setShowViewClassModal(false); setShowClassModal(true); fetchClasses() }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Xếp thêm lớp
              </button>
              <button
                onClick={() => { setShowViewClassModal(false); setSelectedStudent(null); setStudentClasses([]); fetchStudents() }}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Thêm/Sửa */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {form.id ? 'Cập nhật học viên' : 'Thêm học viên mới'}
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
                  <input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Giới tính</label>
                  <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    <option value="nam">Nam</option>
                    <option value="nu">Nữ</option>
                    <option value="khac">Khác</option>
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
                <label className="text-xs text-gray-500 mb-1 block">Địa chỉ</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Học phí</label>
                <div className="relative">
                  <input type="number" value={form.tuition_fee} onChange={e => setForm({...form, tuition_fee: e.target.value})}
                    placeholder="VD: 3500000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none focus:border-blue-400" />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">đ</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Trạng thái</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                  {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ghi chú</label>
                <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={saveStudent} disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
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