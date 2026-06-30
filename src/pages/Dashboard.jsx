// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  LayoutDashboard,
  Target,
  Users,
  School,
  UserCog,
  DollarSign,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Phone,
  Mail,
  Calendar,
  UserPlus
} from 'lucide-react'

const SOURCE_LABELS = {
  facebook: 'Facebook',
  zalo: 'Zalo',
  gioi_thieu: 'Giới thiệu',
  website: 'Website',
  khac: 'Khác',
}

const STATUS_LABELS = {
  moi: 'Mới',
  dang_tu_van: 'Đang tư vấn',
  thu_lop: 'Thử lớp',
  nhat_hoc: 'Nhập học',
  tu_choi: 'Từ chối',
  bao_luu: 'Bảo lưu',
}

const STATUS_COLORS = {
  moi: 'bg-blue-100 text-blue-700',
  dang_tu_van: 'bg-yellow-100 text-yellow-700',
  thu_lop: 'bg-purple-100 text-purple-700',
  nhat_hoc: 'bg-green-100 text-green-700',
  tu_choi: 'bg-red-100 text-red-700',
  bao_luu: 'bg-gray-100 text-gray-600',
}

export default function Dashboard() {
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    leads: 0,
    students: 0,
    classes: 0,
    teachers: 0,
    revenue: 0,
    unpaid: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
    growthRate: 0
  })
  const [recentLeads, setRecentLeads] = useState([])
  const [unpaidList, setUnpaidList] = useState([])
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [paymentStatus, setPaymentStatus] = useState({
    paid: 0,
    unpaid: 0,
    total: 0
  })

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    setLoading(true)
    try {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      // 1. Lấy số lượng Leads tạo trong tháng này
      const { count: leadsCount, error: leadsError } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth)

      if (leadsError) console.error('Lỗi leads:', leadsError)

      // 2. Lấy số lượng Học viên đang học
      const { count: studentsCount, error: studentsError } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'dang_hoc')

      if (studentsError) console.error('Lỗi students:', studentsError)

      // 3. Lấy số lượng Lớp đang học
      const { count: classesCount, error: classesError } = await supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'dang_hoc')

      if (classesError) console.error('Lỗi classes:', classesError)

      // 4. Lấy số lượng Giáo viên đang dạy
      const { count: teachersCount, error: teachersError } = await supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'dang_day')

      if (teachersError) console.error('Lỗi teachers:', teachersError)

      // 5. Lấy danh sách học viên để tính doanh thu
      const { data: allStudents, error: allStudentsError } = await supabase
        .from('students')
        .select('id, full_name, phone, tuition_fee, tuition_paid, created_at, status')

      if (allStudentsError) console.error('Lỗi allStudents:', allStudentsError)

      // 6. Lấy 5 Leads mới nhất
      const { data: recentLeadsData, error: recentError } = await supabase
        .from('leads')
        .select('full_name, phone, source, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentError) console.error('Lỗi recent leads:', recentError)

      // 7. Lấy danh sách học phí chưa thu
      const { data: unpaidStudents, error: unpaidError } = await supabase
        .from('students')
        .select('id, full_name, phone, tuition_fee, tuition_paid')
        .eq('tuition_paid', false)
        .not('tuition_fee', 'is', null)
        .gt('tuition_fee', 0)
        .limit(5)

      if (unpaidError) console.error('Lỗi unpaid students:', unpaidError)

      // ==================== TÍNH TOÁN DỮ LIỆU ====================

      // Tính tổng doanh thu và chưa thu từ students
      let totalRevenue = 0
      let totalUnpaid = 0
      let paidCount = 0
      let unpaidCount = 0

      if (allStudents) {
        allStudents.forEach(s => {
          const fee = Number(s.tuition_fee || 0)
          if (s.tuition_paid && fee > 0) {
            totalRevenue += fee
            paidCount++
          } else if (!s.tuition_paid && fee > 0) {
            totalUnpaid += fee
            unpaidCount++
          }
        })
      }

      // Tính doanh thu tháng này và tháng trước từ students
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

      let revenueThisMonth = 0
      let revenueLastMonth = 0

      if (allStudents) {
        allStudents.forEach(s => {
          if (s.tuition_paid && s.created_at) {
            const date = new Date(s.created_at)
            const fee = Number(s.tuition_fee || 0)
            
            if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
              revenueThisMonth += fee
            }
            if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
              revenueLastMonth += fee
            }
          }
        })
      }

      // Tính tỷ lệ tăng trưởng
      const growthRate = revenueLastMonth > 0
        ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
        : 0

      // Tính doanh thu 12 tháng gần nhất
      const monthlyData = []
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const month = d.getMonth()
        const year = d.getFullYear()
        let total = 0

        if (allStudents) {
          allStudents.forEach(s => {
            if (s.tuition_paid && s.created_at) {
              const date = new Date(s.created_at)
              if (date.getMonth() === month && date.getFullYear() === year) {
                total += Number(s.tuition_fee || 0)
              }
            }
          })
        }

        monthlyData.unshift({
          month: month,
          year: year,
          revenue: total,
          label: `Tháng ${month + 1}/${year}`
        })
      }

      setStats({
        leads: leadsCount || 0,
        students: studentsCount || 0,
        classes: classesCount || 0,
        teachers: teachersCount || 0,
        revenue: totalRevenue,
        unpaid: totalUnpaid,
        revenueThisMonth: revenueThisMonth,
        revenueLastMonth: revenueLastMonth,
        growthRate: growthRate
      })

      setRecentLeads(recentLeadsData || [])
      setUnpaidList(unpaidStudents || [])
      setMonthlyRevenue(monthlyData)
      setPaymentStatus({
        paid: paidCount,
        unpaid: unpaidCount,
        total: paidCount + unpaidCount
      })

    } catch (error) {
      console.error('💥 Lỗi fetchDashboard:', error)
    }
    setLoading(false)
    setRefreshing(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchDashboard()
  }

  function formatCurrency(amount) {
    if (!amount || amount === 0) return '0đ'
    return amount.toLocaleString('vi-VN') + 'đ'
  }

  function getStatusColor(status) {
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'
  }

  function getStatusLabel(status) {
    return STATUS_LABELS[status] || status
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '60vh',
        padding: '40px 20px'
      }}>
        <img
          src="/logo.png"
          alt="TNT English"
          style={{
            width: '60px',
            height: '60px',
            marginBottom: '12px',
            objectFit: 'contain',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        />
        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>
          Đang tải dữ liệu...
        </p>
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
            <LayoutDashboard size={isMobile ? 20 : 24} color="#2563eb" />
            Tổng quan
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
            Thống kê hoạt động trung tâm
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
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
            gap: '6px',
            opacity: refreshing ? 0.6 : 1
          }}
        >
          <RefreshCw
            size={16}
            style={{
              animation: refreshing ? 'spin 1s linear infinite' : 'none'
            }}
          />
          {refreshing ? 'Đang làm mới...' : 'Làm mới'}
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(6, 1fr)',
        gap: isMobile ? '8px' : '12px',
        marginBottom: '16px'
      }}>
        {[
          {
            label: 'Leads mới (tháng)',
            value: stats.leads,
            icon: Target,
            color: '#2563eb',
            bg: '#eff6ff',
            suffix: ''
          },
          {
            label: 'Học viên',
            value: stats.students,
            icon: Users,
            color: '#16a34a',
            bg: '#f0fdf4',
            suffix: ''
          },
          {
            label: 'Lớp học',
            value: stats.classes,
            icon: School,
            color: '#7c3aed',
            bg: '#f5f3ff',
            suffix: ''
          },
          {
            label: 'Giáo viên',
            value: stats.teachers,
            icon: UserCog,
            color: '#d97706',
            bg: '#fffbeb',
            suffix: ''
          },
          {
            label: 'Đã thu',
            value: formatCurrency(stats.revenue),
            icon: DollarSign,
            color: '#16a34a',
            bg: '#f0fdf4',
            suffix: ''
          },
          {
            label: 'Chưa thu',
            value: formatCurrency(stats.unpaid),
            icon: AlertCircle,
            color: '#ef4444',
            bg: '#fef2f2',
            suffix: ''
          },
        ].map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: isMobile ? '12px' : '16px',
              gridColumn: isMobile && index >= 4 ? 'span 1' : 'auto'
            }}>
              <div style={{
                width: isMobile ? '32px' : '36px',
                height: isMobile ? '32px' : '36px',
                borderRadius: '8px',
                background: card.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px'
              }}>
                <Icon size={isMobile ? 16 : 18} color={card.color} />
              </div>
              <p style={{
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 700,
                color: card.color,
                margin: 0
              }}>
                {card.value}
              </p>
              <p style={{
                fontSize: isMobile ? '11px' : '12px',
                color: '#6b7280',
                marginTop: '2px'
              }}>
                {card.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Tăng trưởng doanh thu */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: isMobile ? '14px' : '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Doanh thu tháng này</p>
              <p style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                {formatCurrency(stats.revenueThisMonth)}
              </p>
            </div>
            <div style={{ width: '1px', height: '40px', background: '#e5e7eb' }} />
            <div>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Tháng trước</p>
              <p style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 700, color: '#6b7280', margin: 0 }}>
                {formatCurrency(stats.revenueLastMonth)}
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: stats.growthRate >= 0 ? '#f0fdf4' : '#fef2f2'
          }}>
            {stats.growthRate >= 0 ? (
              <TrendingUp size={20} color="#16a34a" />
            ) : (
              <TrendingDown size={20} color="#ef4444" />
            )}
            <span style={{
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: 700,
              color: stats.growthRate >= 0 ? '#16a34a' : '#ef4444'
            }}>
              {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate}%
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>so với tháng trước</span>
          </div>
        </div>
      </div>

      {/* Biểu đồ doanh thu */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: isMobile ? '14px' : '20px',
        marginBottom: '16px',
        overflowX: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: 600,
            color: '#374151',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <BarChart3 size={isMobile ? 16 : 20} color="#2563eb" />
            Doanh thu 12 tháng gần nhất
          </h3>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          height: isMobile ? '150px' : '200px',
          gap: isMobile ? '2px' : '4px',
          minWidth: isMobile ? '320px' : '100%',
          paddingTop: '20px'
        }}>
          {monthlyRevenue.map((item, index) => {
            const maxRevenue = Math.max(...monthlyRevenue.map(d => d.revenue), 1)
            const height = item.revenue > 0 ? (item.revenue / maxRevenue) * 100 : 4
            const colors = [
              '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
              '#ec4899', '#f43f5e', '#f59e0b', '#f97316',
              '#10b981', '#14b8a6', '#06b6d4', '#3b82f6'
            ]
            const color = colors[index % colors.length]

            return (
              <div key={index} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end'
              }}>
                <div style={{
                  width: isMobile ? '16px' : '24px',
                  height: `${Math.max(height, 4)}%`,
                  background: color,
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
                  fontSize: isMobile ? '7px' : '9px',
                  color: '#6b7280',
                  marginTop: '6px',
                  fontWeight: 500,
                  textAlign: 'center'
                }}>
                  {isMobile ? `${item.month + 1}` : `T${item.month + 1}`}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2 cột dưới */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? '12px' : '16px'
      }}>
        {/* Leads mới nhất */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: isMobile ? '12px 14px' : '14px 16px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 600,
                color: '#374151',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <UserPlus size={isMobile ? 16 : 18} color="#2563eb" />
                Leads mới nhất
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
              {recentLeads.length} leads
            </span>
          </div>
          {recentLeads.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '30px 0',
              color: '#9ca3af'
            }}>
              <Target size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ fontSize: '13px' }}>Chưa có lead mới</p>
            </div>
          ) : isMobile ? (
            <div style={{ padding: '12px' }}>
              {recentLeads.map((lead, index) => (
                <div key={index} style={{
                  padding: '10px 0',
                  borderBottom: index < recentLeads.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '14px', color: '#1f2937' }}>
                        {lead.full_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={11} /> {lead.phone}
                        </span>
                        <span style={{ margin: '0 6px' }}>·</span>
                        <span>{SOURCE_LABELS[lead.source] || lead.source}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(lead.status)}`}>
                      {getStatusLabel(lead.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Họ tên</th>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>SĐT</th>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Nguồn</th>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 16px', fontWeight: 500, color: '#1f2937' }}>
                        {lead.full_name}
                      </td>
                      <td style={{ padding: '8px 16px', color: '#6b7280', fontSize: '13px' }}>
                        {lead.phone}
                      </td>
                      <td style={{ padding: '8px 16px', color: '#6b7280', fontSize: '13px' }}>
                        {SOURCE_LABELS[lead.source] || lead.source}
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(lead.status)}`}>
                          {getStatusLabel(lead.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Học phí chưa thu */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: isMobile ? '12px 14px' : '14px 16px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 600,
                color: '#374151',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={isMobile ? 16 : 18} color="#ef4444" />
                Học phí chưa thu
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
              {unpaidList.length} học viên
            </span>
          </div>
          {unpaidList.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '30px 0',
              color: '#9ca3af'
            }}>
              <CheckCircle size={32} style={{ margin: '0 auto 8px', color: '#16a34a' }} />
              <p style={{ fontSize: '13px' }}>Không có công nợ</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Tất cả học viên đã đóng học phí</p>
            </div>
          ) : isMobile ? (
            <div style={{ padding: '12px' }}>
              {unpaidList.map((student, index) => (
                <div key={index} style={{
                  padding: '10px 0',
                  borderBottom: index < unpaidList.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '14px', color: '#1f2937' }}>
                        {student.full_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        <Phone size={11} style={{ display: 'inline', marginRight: '3px' }} />
                        {student.phone || 'Chưa có SĐT'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#ef4444'
                    }}>
                      {formatCurrency(student.tuition_fee || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Họ tên</th>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>SĐT</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Học phí</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidList.map((student, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 16px', fontWeight: 500, color: '#1f2937' }}>
                        {student.full_name}
                      </td>
                      <td style={{ padding: '8px 16px', color: '#6b7280', fontSize: '13px' }}>
                        {student.phone || '—'}
                      </td>
                      <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                        {formatCurrency(student.tuition_fee || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}