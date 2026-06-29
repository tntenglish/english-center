// src/pages/Revenue.jsx
import { useIsMobile } from '../hooks/useIsMobile'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  BarChart3,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  UserCheck,
  UserX,
  Clock,
  PieChart
} from 'lucide-react'

export default function Revenue() {
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(false)
  const [revenueData, setRevenueData] = useState([])
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalStudents: 0,
    paidStudents: 0,
    unpaidStudents: 0
  })
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [monthlyStats, setMonthlyStats] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [yearlyData, setYearlyData] = useState([])

  useEffect(() => {
    fetchRevenueData()
    fetchMonthlyStats()
    fetchYearlyStats()
  }, [selectedMonth, selectedYear])

  async function fetchRevenueData() {
    setLoading(true)
    try {
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .eq('tuition_paid', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Lỗi lấy dữ liệu:', error)
        setLoading(false)
        return
      }

      const filtered = students.filter(s => {
        if (!s.created_at) return false
        const date = new Date(s.created_at)
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${year}-${month}` === selectedMonth
      })

      const totalRevenue = filtered.reduce((sum, s) => sum + (s.tuition_fee || 0), 0)
      
      const { data: allStudents } = await supabase
        .from('students')
        .select('id, tuition_paid')

      const totalStudents = allStudents?.length || 0
      const paidStudents = allStudents?.filter(s => s.tuition_paid === true).length || 0
      const unpaidStudents = totalStudents - paidStudents

      setRevenueData(filtered)
      setSummary({
        totalRevenue,
        totalStudents,
        paidStudents,
        unpaidStudents
      })

    } catch (error) {
      console.error('Lỗi fetchRevenueData:', error)
    }
    setLoading(false)
  }

  async function fetchMonthlyStats() {
    try {
      const { data: students } = await supabase
        .from('students')
        .select('tuition_fee, created_at')
        .eq('tuition_paid', true)

      if (!students || students.length === 0) {
        setMonthlyStats([])
        return
      }

      const monthMap = {}
      students.forEach(s => {
        if (!s.created_at) return
        const date = new Date(s.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = 0
        }
        monthMap[monthKey] += s.tuition_fee || 0
      })

      const stats = Object.entries(monthMap)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month))

      setMonthlyStats(stats)

    } catch (error) {
      console.error('Lỗi fetchMonthlyStats:', error)
    }
  }

  async function fetchYearlyStats() {
    try {
      const { data: students } = await supabase
        .from('students')
        .select('tuition_fee, created_at')
        .eq('tuition_paid', true)

      if (!students || students.length === 0) {
        setYearlyData([])
        return
      }

      const filtered = students.filter(s => {
        if (!s.created_at) return false
        const year = new Date(s.created_at).getFullYear()
        return year === selectedYear
      })

      const monthMap = {}
      for (let i = 1; i <= 12; i++) {
        monthMap[i] = 0
      }
      
      filtered.forEach(s => {
        if (!s.created_at) return
        const month = new Date(s.created_at).getMonth() + 1
        monthMap[month] += s.tuition_fee || 0
      })

      const data = Object.entries(monthMap).map(([month, revenue]) => ({
        month: parseInt(month),
        revenue
      }))

      setYearlyData(data)

    } catch (error) {
      console.error('Lỗi fetchYearlyStats:', error)
    }
  }

  function formatCurrency(amount) {
    return amount.toLocaleString('vi-VN') + 'đ'
  }

  function getMonthName(month) {
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
    return monthNames[month - 1] || month
  }

  function getBarColor(month) {
    const colors = [
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
      'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
      'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500'
    ]
    return colors[month - 1] || 'bg-gray-500'
  }

  const maxRevenue = yearlyData.length > 0 ? Math.max(...yearlyData.map(d => d.revenue)) : 1

  return (
    <div style={{
      padding: isMobile ? '12px 10px' : '24px',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ 
          fontSize: isMobile ? '18px' : '24px', 
          fontWeight: 600, 
          color: '#1f2937', 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <BarChart3 size={isMobile ? 20 : 24} color="#2563eb" />
          Thống kê Doanh thu
        </h2>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
          Tổng hợp doanh thu từ học phí đã đóng
        </p>
      </div>

      {/* Filter */}
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
          alignItems: isMobile ? 'stretch' : 'flex-end'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ 
              fontSize: '12px', 
              color: '#6b7280', 
              display: 'block', 
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Calendar size={14} />
              Chọn tháng
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
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
          <div style={{ flex: 1 }}>
            <label style={{ 
              fontSize: '12px', 
              color: '#6b7280', 
              display: 'block', 
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Calendar size={14} />
              Chọn năm
            </label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none'
              }}
            >
              {[2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              fetchRevenueData()
              fetchMonthlyStats()
              fetchYearlyStats()
            }}
            style={{
              padding: isMobile ? '8px 16px' : '8px 20px',
              fontSize: isMobile ? '13px' : '14px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              width: isMobile ? '100%' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={16} />
            Cập nhật
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
        gap: isMobile ? '8px' : '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: isMobile ? '12px' : '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <DollarSign size={14} color="#16a34a" />
            <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Tổng doanh thu</p>
          </div>
          <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, color: '#16a34a' }}>
            {formatCurrency(summary.totalRevenue)}
          </p>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: isMobile ? '12px' : '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Users size={14} color="#2563eb" />
            <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Tổng HV</p>
          </div>
          <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, color: '#2563eb' }}>
            {summary.totalStudents}
          </p>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: isMobile ? '12px' : '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <CheckCircle size={14} color="#16a34a" />
            <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Đã đóng</p>
          </div>
          <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, color: '#16a34a' }}>
            {summary.paidStudents}
          </p>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: isMobile ? '12px' : '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <XCircle size={14} color="#ef4444" />
            <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Chưa đóng</p>
          </div>
          <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, color: '#ef4444' }}>
            {summary.unpaidStudents}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: isMobile ? '14px' : '20px',
        marginBottom: '16px',
        overflowX: 'auto'
      }}>
        <h3 style={{
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 600,
          color: '#374151',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <TrendingUp size={isMobile ? 16 : 20} color="#2563eb" />
          Doanh thu theo tháng - Năm {selectedYear}
        </h3>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Đang tải...</p>
        ) : yearlyData.length === 0 || yearlyData.every(d => d.revenue === 0) ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
            <Wallet size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>Chưa có dữ liệu doanh thu</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            height: isMobile ? '180px' : '240px',
            gap: isMobile ? '2px' : '4px',
            minWidth: isMobile ? '300px' : '100%',
            paddingTop: '20px'
          }}>
            {yearlyData.map((item, index) => {
              const height = item.revenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
              return (
                <div key={index} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <div style={{
                    width: isMobile ? '16px' : '28px',
                    height: `${Math.max(height * 0.9, 4)}%`,
                    background: `hsl(${item.month * 30}, 70%, 50%)`,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.5s ease',
                    position: 'relative',
                    minHeight: '4px'
                  }}>
                    {item.revenue > 0 && !isMobile && (
                      <span style={{
                        position: 'absolute',
                        top: '-18px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '9px',
                        color: '#6b7280',
                        fontWeight: 500,
                        whiteSpace: 'nowrap'
                      }}>
                        {formatCurrency(item.revenue)}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: isMobile ? '8px' : '10px',
                    color: '#6b7280',
                    marginTop: '6px',
                    fontWeight: 500
                  }}>
                    {isMobile ? item.month : getMonthName(item.month)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Two columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? '12px' : '16px'
      }}>
        {/* Students list */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: isMobile ? '12px 14px' : '14px 16px',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <h3 style={{
              fontSize: isMobile ? '14px' : '15px',
              fontWeight: 600,
              color: '#374151',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <UserCheck size={isMobile ? 16 : 18} color="#2563eb" />
              Học viên đã đóng
            </h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              {revenueData.length} học viên - Tháng {selectedMonth}
            </p>
          </div>
          <div style={{
            maxHeight: '300px',
            overflow: 'auto'
          }}>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af' }}>Đang tải...</p>
            ) : revenueData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af' }}>
                <Wallet size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p>Chưa có học viên</p>
              </div>
            ) : isMobile ? (
              <div style={{ padding: '12px' }}>
                {revenueData.map((student, index) => (
                  <div key={student.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: index < revenueData.length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '14px', color: '#1f2937' }}>
                        {index + 1}. {student.full_name}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#16a34a' }}>
                      {formatCurrency(student.tuition_fee || 0)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>STT</th>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Họ tên</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Học phí</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: '1px solid #f3f4f6' }}>
                  {revenueData.map((student, index) => (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 16px', color: '#6b7280' }}>{index + 1}</td>
                      <td style={{ padding: '8px 16px', fontWeight: 500, color: '#1f2937' }}>{student.full_name}</td>
                      <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                        {formatCurrency(student.tuition_fee || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Monthly stats */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: isMobile ? '12px 14px' : '14px 16px',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <h3 style={{
              fontSize: isMobile ? '14px' : '15px',
              fontWeight: 600,
              color: '#374151',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <PieChart size={isMobile ? 16 : 18} color="#7c3aed" />
              Doanh thu theo tháng
            </h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              Tổng hợp theo từng tháng
            </p>
          </div>
          <div style={{
            maxHeight: '300px',
            overflow: 'auto'
          }}>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af' }}>Đang tải...</p>
            ) : monthlyStats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af' }}>
                <BarChart3 size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p>Chưa có dữ liệu</p>
              </div>
            ) : isMobile ? (
              <div style={{ padding: '12px' }}>
                {monthlyStats.map((item, index) => {
                  const total = monthlyStats.reduce((sum, i) => sum + i.revenue, 0)
                  const percentage = total > 0 ? Math.round((item.revenue / total) * 100) : 0
                  return (
                    <div key={index} style={{
                      padding: '10px 0',
                      borderBottom: index < monthlyStats.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 500, fontSize: '14px', color: '#1f2937' }}>{item.month}</span>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#16a34a' }}>
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                          <div 
                            style={{
                              height: '100%',
                              background: '#2563eb',
                              borderRadius: '3px',
                              width: `${percentage}%`,
                              transition: 'width 0.5s ease'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', color: '#6b7280', minWidth: '40px', textAlign: 'right' }}>
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Tháng</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Doanh thu</th>
                    <th style={{ textAlign: 'center', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: '1px solid #f3f4f6' }}>
                  {monthlyStats.map((item, index) => {
                    const total = monthlyStats.reduce((sum, i) => sum + i.revenue, 0)
                    const percentage = total > 0 ? Math.round((item.revenue / total) * 100) : 0
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 16px', fontWeight: 500, color: '#1f2937' }}>{item.month}</td>
                        <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                          {formatCurrency(item.revenue)}
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                              <div 
                                style={{
                                  height: '100%',
                                  background: '#2563eb',
                                  borderRadius: '3px',
                                  width: `${percentage}%`,
                                  transition: 'width 0.5s ease'
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '11px', color: '#6b7280', minWidth: '40px', textAlign: 'right' }}>
                              {percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}