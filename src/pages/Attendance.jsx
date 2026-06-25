import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const STATUS_LABELS = {
  co_mat: { label: 'Có mặt', color: 'bg-green-100 text-green-700' },
  vang:   { label: 'Vắng',   color: 'bg-red-100 text-red-700' },
  tre:    { label: 'Trễ',    color: 'bg-yellow-100 text-yellow-700' },
  phep:   { label: 'Phép',   color: 'bg-blue-100 text-blue-700' },
}

export default function Attendance() {
  const [classes, setClasses]       = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [sessionDate, setSessionDate]     = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents]           = useState([])
  const [attendance, setAttendance]       = useState({})
  const [loading, setLoading]             = useState(false)
  const [saving, setSaving]               = useState(false)
  const [saved, setSaved]                 = useState(false)
  
  // State cho thống kê
  const [showStats, setShowStats] = useState(false)
  const [statsData, setStatsData] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => { fetchClasses() }, [])
  useEffect(() => {
    if (selectedClass && sessionDate) fetchStudentsAndAttendance()
  }, [selectedClass, sessionDate])

  async function fetchClasses() {
    const { data } = await supabase
      .from('classes')
      .select('id, name, schedule')
      .eq('status', 'dang_hoc')
      .order('name')
    setClasses(data || [])
  }

  async function fetchStudentsAndAttendance() {
    setLoading(true)
    setSaved(false)

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
    }
    
    setLoading(false)
  }

  // Hàm lấy thống kê chuyên cần
  async function fetchAttendanceStats() {
    if (!selectedClass) {
      alert('Vui lòng chọn lớp!')
      return
    }
    
    setLoadingStats(true)
    setShowStats(true)

    try {
      // 1. Lấy danh sách học viên trong lớp
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

      // 2. Lấy tất cả điểm danh của các học viên trong lớp
      const { data: allAttendance } = await supabase
        .from('attendance')
        .select('student_id, status, session_date')
        .eq('class_id', selectedClass)
        .in('student_id', studentIds)
        .order('session_date', { ascending: false })

      // 3. Tính toán thống kê cho từng học viên
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

      // Sắp xếp theo % đi học giảm dần
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

  // Hàm lấy màu cho % đi học
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Điểm danh</h2>
        <p className="text-sm text-gray-400 mt-0.5">Ghi nhận chuyên cần theo buổi học</p>
      </div>

      {/* Chọn lớp + ngày */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="text-xs text-gray-500 mb-1 block">Chọn lớp học</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="">-- Chọn lớp --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Ngày học</label>
            <input
              type="date"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchAttendanceStats}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              📊 Thống kê chuyên cần
            </button>
          </div>
        </div>
      </div>

      {/* Chưa chọn lớp */}
      {!selectedClass && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>Chọn lớp và ngày học để bắt đầu điểm danh</p>
        </div>
      )}

      {/* Danh sách điểm danh */}
      {selectedClass && (
        <>
          {/* Thống kê nhanh */}
          {students.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <div key={k} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                  <p className="text-2xl font-semibold text-gray-800">{stats[k]}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.color}`}>{v.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bảng điểm danh */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {loading ? 'Đang tải...' : `${students.length} học viên`}
              </p>
              {saved && <span className="text-xs text-green-600 font-medium">✓ Đã lưu</span>}
            </div>

            {loading ? (
              <p className="text-center py-10 text-gray-400">Đang tải danh sách...</p>
            ) : students.length === 0 ? (
              <p className="text-center py-10 text-gray-400">Lớp này chưa có học viên nào</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Họ tên</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">SĐT</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Trạng thái</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {s.full_name}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {s.phone || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <button
                              key={k}
                              onClick={() => setStatus(s.id, k)}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium transition border ${
                                attendance[s.id]?.status === k
                                  ? v.color + ' border-transparent'
                                  : 'text-gray-400 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {v.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={attendance[s.id]?.note || ''}
                          onChange={ev => setNote(s.id, ev.target.value)}
                          placeholder="Lý do vắng..."
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-36 focus:outline-none focus:border-blue-400"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Nút lưu */}
          {students.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : '💾 Lưu điểm danh'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal Thống kê chuyên cần */}
      {showStats && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  📊 Thống kê chuyên cần
                </h3>
                <p className="text-sm text-gray-500">
                  Lớp: <span className="font-medium text-gray-700">
                    {classes.find(c => c.id === selectedClass)?.name || 'Chưa chọn lớp'}
                  </span>
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowStats(false)
                  setStatsData([])
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            {loadingStats ? (
              <p className="text-center py-10 text-gray-400">Đang tải dữ liệu...</p>
            ) : statsData.length === 0 ? (
              <p className="text-center py-10 text-gray-400">Chưa có dữ liệu điểm danh</p>
            ) : (
              <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">STT</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Họ tên</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Tổng buổi</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Có mặt</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Vắng</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Trễ</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Phép</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">% Đi học</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {statsData.map((item, index) => (
                      <tr key={item.student_id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-500 text-center">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{item.full_name}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{item.totalSessions}</td>
                        <td className="px-4 py-3 text-center text-green-600 font-medium">{item.presentSessions}</td>
                        <td className="px-4 py-3 text-center text-red-500 font-medium">{item.absentSessions}</td>
                        <td className="px-4 py-3 text-center text-yellow-600 font-medium">{item.lateSessions}</td>
                        <td className="px-4 py-3 text-center text-blue-500 font-medium">{item.leaveSessions}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full font-bold text-sm ${getRateBg(item.attendanceRate)} ${getRateColor(item.attendanceRate)}`}>
                            {item.attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-between items-center">
              <div className="text-xs text-gray-400">
                Tổng số: {statsData.length} học viên
              </div>
              <button 
                onClick={() => {
                  setShowStats(false)
                  setStatsData([])
                }}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
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