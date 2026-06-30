// src/pages/Schedule.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  User,
  Users,
  School,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Home
} from 'lucide-react'

// ==================== CONSTANTS ====================

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

const ROOMS = [
  { id: 'room1', name: 'Phòng 1' },
  { id: 'room2', name: 'Phòng 2' },
  { id: 'room3', name: 'Phòng 3' },
]

// Màu cho giáo viên (tự động gán)
const TEACHER_COLORS = [
  '#3b82f6', // Xanh dương
  '#10b981', // Xanh lá
  '#f59e0b', // Vàng
  '#ef4444', // Đỏ
  '#8b5cf6', // Tím
  '#ec4899', // Hồng
  '#14b8a6', // Xanh ngọc
  '#f97316', // Cam
  '#6366f1', // Indigo
  '#84cc16', // Xanh chanh
  '#06b6d4', // Xanh dương nhạt
  '#d946ef', // Hồng tím
  '#f43f5e', // Hồng đỏ
  '#0ea5e9', // Xanh trời
]

// ==================== COMPONENTS ====================

export default function Schedule() {
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState([])
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [teacherColors, setTeacherColors] = useState({})
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [formData, setFormData] = useState({
    date: '',
    day_of_week: 0,
    room_id: '',
    time_slot: '06:00-07:30',
    class_id: '',
    teacher_id: '',
    note: ''
  })

  useEffect(() => {
    fetchData()
  }, [currentDate])

  async function fetchData() {
    setLoading(true)
    try {
      // 1. Lấy danh sách giáo viên đang dạy
      const { data: teachersData } = await supabase
        .from('teachers')
        .select('id, full_name')
        .eq('status', 'dang_day')
      
      setTeachers(teachersData || [])
      
      // 2. Gán màu cho giáo viên
      const colors = {}
      teachersData?.forEach((t, index) => {
        colors[t.id] = TEACHER_COLORS[index % TEACHER_COLORS.length]
      })
      setTeacherColors(colors)

      // 3. Lấy danh sách lớp đang học
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, teacher_id, max_students')
        .eq('status', 'dang_hoc')
      
      setClasses(classesData || [])

      // 4. Lấy lịch dạy trong tuần hiện tại
      const weekStart = getWeekStart(currentDate)
      const weekEnd = getWeekEnd(currentDate)
      
      const { data: schedulesData } = await supabase
        .from('schedules')
        .select(`
          *,
          class:class_id (id, name, max_students),
          teacher:teacher_id (id, full_name)
        `)
        .gte('date', weekStart.toISOString().split('T')[0])
        .lte('date', weekEnd.toISOString().split('T')[0])
      
      setSchedules(schedulesData || [])
      
    } catch (error) {
      console.error('❌ Lỗi fetchData:', error)
    }
    setLoading(false)
  }

  function getWeekStart(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  function getWeekEnd(date) {
    const d = getWeekStart(date)
    d.setDate(d.getDate() + 6)
    return d
  }

  function getDayOfWeek(date) {
    const d = new Date(date)
    const day = d.getDay()
    return day === 0 ? 6 : day - 1
  }

  function formatDate(date) {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
  }

  function getSchedulesForCell(dayIndex, roomId, timeSlot) {
    const weekStart = getWeekStart(currentDate)
    const date = new Date(weekStart)
    date.setDate(date.getDate() + dayIndex)
    const dateStr = date.toISOString().split('T')[0]
    
    return schedules.filter(s => {
      const sDate = new Date(s.date).toISOString().split('T')[0]
      return sDate === dateStr && s.room_id === roomId && s.time_slot === timeSlot
    })
  }

  function getTimeSlots() {
    const slots = ['06:00-07:30', '07:30-09:00']
    schedules.forEach(s => {
      if (s.time_slot && !slots.includes(s.time_slot)) {
        slots.push(s.time_slot)
      }
    })
    return slots.sort()
  }

  function getTeacherName(teacherId) {
    const teacher = teachers.find(t => t.id === teacherId)
    return teacher?.full_name || '—'
  }

  function getClassName(classId) {
    const cls = classes.find(c => c.id === classId)
    return cls?.name || '—'
  }

  function getClassStudents(classId) {
    const cls = classes.find(c => c.id === classId)
    return cls?.max_students || 0
  }

  function getTeacherColor(teacherId) {
    if (!teacherId) return '#6b7280'
    // Tìm giáo viên trong danh sách
    const index = teachers.findIndex(t => t.id === teacherId)
    if (index >= 0) {
      return TEACHER_COLORS[index % TEACHER_COLORS.length]
    }
    // Nếu không tìm thấy, tạo màu ngẫu nhiên dựa trên ID
    const hash = teacherId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return TEACHER_COLORS[hash % TEACHER_COLORS.length]
  }

  // Điều hướng tuần
  function prevWeek() {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  function nextWeek() {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  function goToToday() {
    setCurrentDate(new Date())
  }

  function handleDateChange(e) {
    const [year, month, day] = e.target.value.split('-').map(Number)
    setCurrentDate(new Date(year, month - 1, day))
  }

  // Modal handlers
  function handleAddSchedule(dayIndex, roomId, timeSlot) {
    const weekStart = getWeekStart(currentDate)
    const date = new Date(weekStart)
    date.setDate(date.getDate() + dayIndex)
    const dateStr = date.toISOString().split('T')[0]
    
    const existing = getSchedulesForCell(dayIndex, roomId, timeSlot)
    if (existing.length > 0) {
      alert(`⚠️ Phòng này đã có lịch dạy vào khung giờ này!`)
      return
    }
    
    setEditingSchedule(null)
    setFormData({
      date: dateStr,
      day_of_week: dayIndex,
      room_id: roomId,
      time_slot: timeSlot,
      class_id: '',
      teacher_id: '',
      note: ''
    })
    setShowModal(true)
  }

  function handleEditSchedule(schedule) {
    setEditingSchedule(schedule)
    setFormData({
      id: schedule.id,
      date: schedule.date,
      day_of_week: getDayOfWeek(new Date(schedule.date)),
      room_id: schedule.room_id,
      time_slot: schedule.time_slot,
      class_id: schedule.class_id,
      teacher_id: schedule.teacher_id,
      note: schedule.note || ''
    })
    setShowModal(true)
  }

  function handleViewSchedule(schedule) {
    setSelectedSchedule(schedule)
    setShowDetail(true)
  }

  async function handleSaveSchedule() {
    if (!formData.class_id || !formData.teacher_id) {
      alert('Vui lòng chọn lớp và giáo viên!')
      return
    }

    try {
      const payload = {
        date: formData.date,
        room_id: formData.room_id,
        time_slot: formData.time_slot,
        class_id: formData.class_id,
        teacher_id: formData.teacher_id,
        note: formData.note || '',
        status: 'dang_hoc'
      }

      // Kiểm tra xung đột
      const conflict = await checkConflict(payload)
      if (conflict) {
        if (!confirm(`⚠️ ${conflict}\n\nBạn có muốn tiếp tục không?`)) {
          return
        }
      }

      let result
      if (editingSchedule) {
        result = await supabase
          .from('schedules')
          .update(payload)
          .eq('id', editingSchedule.id)
      } else {
        result = await supabase
          .from('schedules')
          .insert(payload)
      }

      if (result.error) {
        alert(`Lỗi: ${result.error.message}`)
        return
      }

      setShowModal(false)
      fetchData()
      alert(editingSchedule ? '✅ Đã cập nhật lịch dạy!' : '✅ Đã thêm lịch dạy!')
      
    } catch (error) {
      alert(`Có lỗi xảy ra: ${error.message}`)
    }
  }

  async function checkConflict(payload) {
    const { data: existing } = await supabase
      .from('schedules')
      .select(`
        *,
        class:class_id (name),
        teacher:teacher_id (full_name)
      `)
      .eq('date', payload.date)
      .eq('time_slot', payload.time_slot)
    
    if (!existing || existing.length === 0) return null

    const conflicts = []
    existing.forEach(s => {
      if (s.id === editingSchedule?.id) return
      if (s.room_id === payload.room_id) {
        conflicts.push(`🏫 Phòng: ${s.room_id} - Lớp: ${s.class?.name}`)
      }
      if (s.teacher_id === payload.teacher_id) {
        conflicts.push(`👨‍🏫 Giáo viên: ${s.teacher?.full_name} - Lớp: ${s.class?.name}`)
      }
    })

    if (conflicts.length > 0) {
      return `Xung đột với:\n${conflicts.join('\n')}`
    }
    return null
  }

  async function handleDeleteSchedule(id) {
    if (!confirm('Bạn có chắc muốn xóa lịch dạy này?')) return
    
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
    
    if (error) {
      alert(`Lỗi xóa: ${error.message}`)
    } else {
      fetchData()
      alert('✅ Đã xóa lịch dạy!')
    }
  }

  // Render bảng lịch
  const weekStart = getWeekStart(currentDate)
  const weekEnd = getWeekEnd(currentDate)
  const timeSlots = getTimeSlots()

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
            <Calendar size={isMobile ? 20 : 24} color="#2563eb" />
            Lịch dạy
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
            Tuần {formatDate(weekStart)} - {formatDate(weekEnd)}
          </p>
        </div>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          width: isMobile ? '100%' : 'auto'
        }}>
          <button
            onClick={goToToday}
            style={{
              padding: isMobile ? '8px 12px' : '8px 16px',
              fontSize: isMobile ? '13px' : '14px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Home size={16} />
            Hôm nay
          </button>
          <input
            type="date"
            value={currentDate.toISOString().split('T')[0]}
            onChange={handleDateChange}
            style={{
              padding: isMobile ? '8px 12px' : '8px 12px',
              fontSize: isMobile ? '13px' : '14px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: isMobile ? '8px 12px' : '12px 16px'
      }}>
        <button
          onClick={prevWeek}
          style={{
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          <ChevronLeft size={24} />
        </button>
        <div style={{
          fontSize: isMobile ? '14px' : '18px',
          fontWeight: 600,
          color: '#1f2937'
        }}>
          Tuần {formatDate(weekStart)} - {formatDate(weekEnd)}
        </div>
        <button
          onClick={nextWeek}
          style={{
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Schedule Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'auto'
      }}>
        <div style={{
          minWidth: isMobile ? '800px' : '100%',
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: isMobile ? '12px' : '14px'
          }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{
                  padding: isMobile ? '8px' : '12px 16px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#6b7280',
                  minWidth: '80px',
                  position: 'sticky',
                  left: 0,
                  background: '#f9fafb',
                  zIndex: 1
                }}>
                  Giờ / Phòng
                </th>
                {DAYS.map((day, index) => {
                  const date = new Date(weekStart)
                  date.setDate(date.getDate() + index)
                  const isToday = date.toDateString() === new Date().toDateString()
                  return (
                    <th key={index} style={{
                      padding: isMobile ? '8px' : '12px 16px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: isToday ? '#2563eb' : '#6b7280',
                      borderLeft: '1px solid #e5e7eb',
                      minWidth: isMobile ? '100px' : '140px',
                      background: isToday ? '#eff6ff' : '#f9fafb'
                    }}>
                      {day}
                      <div style={{
                        fontSize: isMobile ? '10px' : '12px',
                        fontWeight: 400,
                        color: isToday ? '#2563eb' : '#9ca3af'
                      }}>
                        {date.getDate()}/{date.getMonth() + 1}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {ROOMS.map(room => {
                const roomId = room.id
                return (
                  <tr key={roomId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{
                      padding: isMobile ? '8px' : '12px 16px',
                      fontWeight: 500,
                      color: '#374151',
                      position: 'sticky',
                      left: 0,
                      background: 'white',
                      zIndex: 1,
                      borderRight: '1px solid #e5e7eb'
                    }}>
                      <School size={16} style={{ display: 'inline', marginRight: '4px' }} />
                      {room.name}
                    </td>
                    {DAYS.map((day, dayIndex) => {
                      const date = new Date(weekStart)
                      date.setDate(date.getDate() + dayIndex)
                      const dateStr = date.toISOString().split('T')[0]
                      
                      const daySchedules = schedules.filter(s => {
                        const sDate = new Date(s.date).toISOString().split('T')[0]
                        return sDate === dateStr && s.room_id === roomId
                      })

                      const slotsMap = {}
                      daySchedules.forEach(s => {
                        if (!slotsMap[s.time_slot]) {
                          slotsMap[s.time_slot] = []
                        }
                        slotsMap[s.time_slot].push(s)
                      })

                      const timeSlotsForDay = [...new Set([...timeSlots, ...Object.keys(slotsMap)])].sort()

                      return (
                        <td key={dayIndex} style={{
                          padding: isMobile ? '4px' : '8px',
                          borderLeft: '1px solid #e5e7eb',
                          verticalAlign: 'top',
                          minHeight: '80px',
                          background: date.toDateString() === new Date().toDateString() ? '#f8fafc' : 'white'
                        }}>
                          {timeSlotsForDay.map((slot, slotIndex) => {
                            const slots = slotsMap[slot] || []
                            const hasSchedule = slots.length > 0
                            
                            // Nếu có nhiều lớp trong cùng slot
                            if (hasSchedule && slots.length > 1) {
                              return slots.map((schedule, idx) => {
                                const teacherColor = getTeacherColor(schedule.teacher_id)
                                return (
                                  <div
                                    key={`${slotIndex}-${idx}`}
                                    style={{
                                      padding: isMobile ? '4px 6px' : '6px 8px',
                                      marginBottom: '4px',
                                      borderRadius: '6px',
                                      background: teacherColor,
                                      color: 'white',
                                      cursor: 'pointer',
                                      minHeight: '40px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s',
                                      position: 'relative'
                                    }}
                                    onClick={() => handleViewSchedule(schedule)}
                                    onMouseEnter={e => {
                                      e.target.style.opacity = '0.85'
                                    }}
                                    onMouseLeave={e => {
                                      e.target.style.opacity = '1'
                                    }}
                                  >
                                    <div style={{
                                      fontSize: isMobile ? '10px' : '11px',
                                      fontWeight: 600,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}>
                                      <span>{schedule.class?.name || '—'}</span>
                                      <span style={{
                                        fontSize: isMobile ? '8px' : '10px',
                                        opacity: 0.8
                                      }}>
                                        {slot}
                                      </span>
                                    </div>
                                    <div style={{
                                      fontSize: isMobile ? '8px' : '10px',
                                      opacity: 0.9,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      marginTop: '2px'
                                    }}>
                                      <User size={isMobile ? 10 : 12} />
                                      {schedule.teacher?.full_name || getTeacherName(schedule.teacher_id) || '—'}
                                      <span style={{ marginLeft: 'auto' }}>
                                        👥 {getClassStudents(schedule.class_id)}
                                      </span>
                                    </div>
                                    <div style={{
                                      display: 'flex',
                                      gap: '4px',
                                      marginTop: '4px'
                                    }}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleViewSchedule(schedule)
                                        }}
                                        style={{
                                          padding: '2px 6px',
                                          fontSize: isMobile ? '8px' : '10px',
                                          background: 'rgba(255,255,255,0.2)',
                                          border: 'none',
                                          borderRadius: '4px',
                                          color: 'white',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <Eye size={isMobile ? 10 : 12} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditSchedule(schedule)
                                        }}
                                        style={{
                                          padding: '2px 6px',
                                          fontSize: isMobile ? '8px' : '10px',
                                          background: 'rgba(255,255,255,0.2)',
                                          border: 'none',
                                          borderRadius: '4px',
                                          color: 'white',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <Edit size={isMobile ? 10 : 12} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteSchedule(schedule.id)
                                        }}
                                        style={{
                                          padding: '2px 6px',
                                          fontSize: isMobile ? '8px' : '10px',
                                          background: 'rgba(255,255,255,0.2)',
                                          border: 'none',
                                          borderRadius: '4px',
                                          color: 'white',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <Trash2 size={isMobile ? 10 : 12} />
                                      </button>
                                    </div>
                                  </div>
                                )
                              })
                            }
                            
                            // Nếu chỉ có 1 lớp hoặc không có lớp
                            return (
                              <div
                                key={slotIndex}
                                onClick={() => {
                                  if (!hasSchedule) {
                                    handleAddSchedule(dayIndex, roomId, slot)
                                  } else {
                                    handleViewSchedule(slots[0])
                                  }
                                }}
                                style={{
                                  padding: isMobile ? '4px 6px' : '6px 8px',
                                  marginBottom: '4px',
                                  borderRadius: '6px',
                                  background: hasSchedule ? getTeacherColor(slots[0].teacher_id) : '#f3f4f6',
                                  color: hasSchedule ? 'white' : '#9ca3af',
                                  cursor: 'pointer',
                                  minHeight: '40px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s',
                                  border: hasSchedule ? 'none' : '1px dashed #d1d5db'
                                }}
                                onMouseEnter={e => {
                                  if (!hasSchedule) {
                                    e.target.style.background = '#e5e7eb'
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!hasSchedule) {
                                    e.target.style.background = '#f3f4f6'
                                  }
                                }}
                              >
                                {hasSchedule ? (
                                  <>
                                    <div style={{
                                      fontSize: isMobile ? '10px' : '11px',
                                      fontWeight: 600,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}>
                                      <span>{slots[0].class?.name || '—'}</span>
                                      <span style={{
                                        fontSize: isMobile ? '8px' : '10px',
                                        opacity: 0.8
                                      }}>
                                        {slot}
                                      </span>
                                    </div>
                                    <div style={{
                                      fontSize: isMobile ? '8px' : '10px',
                                      opacity: 0.9,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      marginTop: '2px'
                                    }}>
                                      <User size={isMobile ? 10 : 12} />
                                      {slots[0].teacher?.full_name || getTeacherName(slots[0].teacher_id) || '—'}
                                      <span style={{ marginLeft: 'auto' }}>
                                        👥 {getClassStudents(slots[0].class_id)}
                                      </span>
                                    </div>
                                    <div style={{
                                      display: 'flex',
                                      gap: '4px',
                                      marginTop: '4px'
                                    }}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleViewSchedule(slots[0])
                                        }}
                                        style={{
                                          padding: '2px 6px',
                                          fontSize: isMobile ? '8px' : '10px',
                                          background: 'rgba(255,255,255,0.2)',
                                          border: 'none',
                                          borderRadius: '4px',
                                          color: 'white',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <Eye size={isMobile ? 10 : 12} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditSchedule(slots[0])
                                        }}
                                        style={{
                                          padding: '2px 6px',
                                          fontSize: isMobile ? '8px' : '10px',
                                          background: 'rgba(255,255,255,0.2)',
                                          border: 'none',
                                          borderRadius: '4px',
                                          color: 'white',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <Edit size={isMobile ? 10 : 12} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteSchedule(slots[0].id)
                                        }}
                                        style={{
                                          padding: '2px 6px',
                                          fontSize: isMobile ? '8px' : '10px',
                                          background: 'rgba(255,255,255,0.2)',
                                          border: 'none',
                                          borderRadius: '4px',
                                          color: 'white',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <Trash2 size={isMobile ? 10 : 12} />
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div style={{
                                    fontSize: isMobile ? '9px' : '10px',
                                    color: '#9ca3af',
                                    textAlign: 'center'
                                  }}>
                                    + Thêm
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '12px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', marginRight: '8px' }}>
          👨‍🏫 Giáo viên:
        </div>
        {teachers.map(t => (
          <div key={t.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: '#f3f4f6'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '4px',
              background: getTeacherColor(t.id)
            }} />
            <span style={{ fontSize: '12px' }}>{t.full_name}</span>
          </div>
        ))}
      </div>

      {/* ==================== MODAL THÊM/SỬA LỊCH ==================== */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: isMobile ? '16px' : '0'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: isMobile ? '20px' : '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
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
                <Calendar size={20} color="#2563eb" />
                {editingSchedule ? 'Sửa lịch dạy' : 'Thêm lịch dạy'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
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

            {/* Modal Body */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '12px'
            }}>
              {/* Ngày */}
              <div style={{ gridColumn: isMobile ? '1' : '1/3' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Ngày
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
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

              {/* Phòng */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Phòng học
                </label>
                <select
                  value={formData.room_id}
                  onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  {ROOMS.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </div>

              {/* Ca học */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Ca học
                </label>
                <input
                  type="text"
                  value={formData.time_slot}
                  onChange={(e) => setFormData({...formData, time_slot: e.target.value})}
                  placeholder="VD: 06:00-07:30"
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

              {/* Lớp học */}
              <div style={{ gridColumn: isMobile ? '1' : '1/3' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Lớp học *
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) => {
                    const classId = e.target.value
                    const cls = classes.find(c => c.id === classId)
                    setFormData({
                      ...formData,
                      class_id: classId,
                      teacher_id: cls?.teacher_id || ''
                    })
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (👥 {cls.max_students}hs) - GV: {getTeacherName(cls.teacher_id)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Giáo viên */}
              <div style={{ gridColumn: isMobile ? '1' : '1/3' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Giáo viên *
                </label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Chọn giáo viên --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
                {formData.class_id && (
                  <div style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginTop: '4px',
                    fontStyle: 'italic'
                  }}>
                    💡 Giáo viên mặc định của lớp: <strong>{getTeacherName(classes.find(c => c.id === formData.class_id)?.teacher_id)}</strong>
                    {formData.teacher_id && formData.teacher_id !== classes.find(c => c.id === formData.class_id)?.teacher_id && (
                      <span style={{ color: '#f59e0b' }}> (Đã thay đổi)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <div style={{ gridColumn: isMobile ? '1' : '1/3' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Ghi chú
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  placeholder="Nhập ghi chú (nếu có)..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '20px'
            }}>
              <button
                onClick={handleSaveSchedule}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Save size={16} />
                Lưu
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: 'none',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL CHI TIẾT LỊCH ==================== */}
      {showDetail && selectedSchedule && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: isMobile ? '16px' : '0'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: isMobile ? '20px' : '24px',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Header */}
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
                <Eye size={20} color="#2563eb" />
                Chi tiết lịch dạy
              </h3>
              <button
                onClick={() => setShowDetail(false)}
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

            {/* Content */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <span style={{ color: '#6b7280' }}>📚 Lớp học</span>
                  <span style={{ fontWeight: 500, color: '#1f2937' }}>
                    {getClassName(selectedSchedule.class_id)}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <span style={{ color: '#6b7280' }}>👨‍🏫 Giáo viên</span>
                  <span style={{ fontWeight: 500, color: '#1f2937' }}>
                    {getTeacherName(selectedSchedule.teacher_id)}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <span style={{ color: '#6b7280' }}>🏫 Phòng</span>
                  <span style={{ fontWeight: 500, color: '#1f2937' }}>
                    {selectedSchedule.room_id}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <span style={{ color: '#6b7280' }}>⏰ Ca học</span>
                  <span style={{ fontWeight: 500, color: '#1f2937' }}>
                    {selectedSchedule.time_slot}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <span style={{ color: '#6b7280' }}>📅 Ngày</span>
                  <span style={{ fontWeight: 500, color: '#1f2937' }}>
                    {new Date(selectedSchedule.date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {selectedSchedule.note && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <span style={{ color: '#6b7280' }}>📝 Ghi chú</span>
                    <span style={{ fontWeight: 500, color: '#1f2937' }}>
                      {selectedSchedule.note}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => {
                  setShowDetail(false)
                  handleEditSchedule(selectedSchedule)
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Edit size={16} />
                Sửa
              </button>
              <button
                onClick={() => {
                  setShowDetail(false)
                  handleDeleteSchedule(selectedSchedule.id)
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Trash2 size={16} />
                Xóa
              </button>
              <button
                onClick={() => setShowDetail(false)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
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