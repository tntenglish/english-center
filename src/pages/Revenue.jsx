import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Revenue() {
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
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">📊 Thống kê Doanh thu</h2>
        <p className="text-sm text-gray-400 mt-0.5">Tổng hợp doanh thu từ học phí đã đóng</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex gap-4 flex-wrap items-end">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Chọn tháng</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Chọn năm</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            🔄 Cập nhật
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Tổng doanh thu tháng</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalRevenue)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Tổng số học viên</p>
          <p className="text-2xl font-bold text-blue-600">
            {summary.totalStudents}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Đã đóng học phí</p>
          <p className="text-2xl font-bold text-green-600">
            {summary.paidStudents}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Chưa đóng học phí</p>
          <p className="text-2xl font-bold text-red-500">
            {summary.unpaidStudents}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          📈 Doanh thu theo tháng - Năm {selectedYear}
        </h3>
        {loading ? (
          <p className="text-center py-8 text-gray-400">Đang tải...</p>
        ) : yearlyData.length === 0 || yearlyData.every(d => d.revenue === 0) ? (
          <p className="text-center py-8 text-gray-400">Chưa có dữ liệu doanh thu</p>
        ) : (
          <div className="flex items-end h-64 gap-2">
            {yearlyData.map((item, index) => {
              const height = item.revenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center">
                    <div 
                      className={`w-full rounded-t-lg ${getBarColor(item.month)} transition-all duration-500`}
                      style={{ height: `${Math.max(height * 0.9, 4)}%` }}
                    >
                      <div className="text-center text-xs text-white font-medium pt-1 opacity-0 hover:opacity-100 transition-opacity">
                        {item.revenue > 0 ? formatCurrency(item.revenue) : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs text-gray-500">{getMonthName(item.month)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">
              👨‍🎓 Học viên đã đóng - Tháng {selectedMonth}
            </h3>
            <p className="text-xs text-gray-400">{revenueData.length} học viên</p>
          </div>
          <div className="max-h-80 overflow-auto">
            {loading ? (
              <p className="text-center py-8 text-gray-400">Đang tải...</p>
            ) : revenueData.length === 0 ? (
              <p className="text-center py-8 text-gray-400">Chưa có học viên đóng học phí trong tháng này</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">STT</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Họ tên</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Học phí</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {revenueData.map((student, index) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2 text-gray-500">{index + 1}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">{student.full_name}</td>
                      <td className="px-4 py-2 text-right text-green-600 font-medium">
                        {formatCurrency(student.tuition_fee || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">
              📊 Doanh thu theo tháng
            </h3>
            <p className="text-xs text-gray-400">Tổng hợp theo từng tháng</p>
          </div>
          <div className="max-h-80 overflow-auto">
            {loading ? (
              <p className="text-center py-8 text-gray-400">Đang tải...</p>
            ) : monthlyStats.length === 0 ? (
              <p className="text-center py-8 text-gray-400">Chưa có dữ liệu</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Tháng</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Doanh thu</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthlyStats.map((item, index) => {
                    const total = monthlyStats.reduce((sum, i) => sum + i.revenue, 0)
                    const percentage = total > 0 ? Math.round((item.revenue / total) * 100) : 0
                    return (
                      <tr key={index} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-2 font-medium text-gray-700">{item.month}</td>
                        <td className="px-4 py-2 text-right text-green-600 font-medium">
                          {formatCurrency(item.revenue)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-12 text-right">{percentage}%</span>
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