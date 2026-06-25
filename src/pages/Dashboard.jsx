import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({
    leads: 0, students: 0, classes: 0,
    revenue: 0, unpaid: 0, teachers: 0,
  })
  const [recentLeads, setRecentLeads]     = useState([])
  const [unpaidList, setUnpaidList]       = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => { fetchDashboard() }, [])

  async function fetchDashboard() {
    setLoading(true)
    const [leads, students, classes, teachers, payments, recentL, unpaidP] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact' }).eq('status', 'moi'),
      supabase.from('students').select('id', { count: 'exact' }).eq('status', 'dang_hoc'),
      supabase.from('classes').select('id', { count: 'exact' }).eq('status', 'dang_hoc'),
      supabase.from('teachers').select('id', { count: 'exact' }).eq('status', 'dang_day'),
      supabase.from('payments').select('amount, discount, final_amount, status'),
      supabase.from('leads').select('full_name, phone, source, status, created_at')
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('payments').select(`
        amount, final_amount, students(full_name, phone), classes(name)
      `).eq('status', 'chua_thanh_toan').limit(5),
    ])

    const allPayments = payments.data || []
    const revenue = allPayments
      .filter(p => p.status === 'da_thanh_toan')
      .reduce((sum, p) => sum + Number(p.final_amount || p.amount), 0)
    const unpaid = allPayments
      .filter(p => p.status === 'chua_thanh_toan')
      .reduce((sum, p) => sum + Number(p.final_amount || p.amount), 0)

    setStats({
      leads:    leads.count    || 0,
      students: students.count || 0,
      classes:  classes.count  || 0,
      teachers: teachers.count || 0,
      revenue, unpaid,
    })
    setRecentLeads(recentL.data || [])
    setUnpaidList(unpaidP.data || [])
    setLoading(false)
  }

  const SOURCE_LABELS = {
    facebook: 'Facebook', zalo: 'Zalo',
    gioi_thieu: 'Giới thiệu', website: 'Website', khac: 'Khác',
  }

  const STATUS_COLORS = {
    moi: 'bg-blue-100 text-blue-700',
    dang_tu_van: 'bg-yellow-100 text-yellow-700',
    thu_lop: 'bg-purple-100 text-purple-700',
    nhat_hoc: 'bg-green-100 text-green-700',
    tu_choi: 'bg-red-100 text-red-700',
    bao_luu: 'bg-gray-100 text-gray-600',
  }

  const STATUS_LABELS = {
    moi: 'Mới', dang_tu_van: 'Tư vấn', thu_lop: 'Thử lớp',
    nhat_hoc: 'Nhập học', tu_choi: 'Từ chối', bao_luu: 'Bảo lưu',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400">
      Đang tải...
    </div>
  )

  return (
     <>
    <p style={{background:'red', color:'white', padding:'10px'}}>
      VERSION MỚI - MOBILE TEST
    </p>
    <div className="p-6 space-y-6">
      {/* phần còn lại giữ nguyên */}
    </div>
  </>
)


    <div className="p-6 space-y-6">
      {/* Tiêu đề */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">Tổng quan hoạt động trung tâm</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Leads mới',      value: stats.leads,    color: 'text-blue-600',   bg: 'bg-blue-50',   icon: '🎯' },
          { label: 'Học viên',       value: stats.students, color: 'text-green-600',  bg: 'bg-green-50',  icon: '👨‍🎓' },
          { label: 'Lớp đang học',   value: stats.classes,  color: 'text-purple-600', bg: 'bg-purple-50', icon: '🏫' },
          { label: 'Giáo viên',      value: stats.teachers, color: 'text-amber-600',  bg: 'bg-amber-50',  icon: '👩‍🏫' },
          { label: 'Đã thu',
            value: stats.revenue.toLocaleString('vi-VN') + 'đ',
            color: 'text-green-600', bg: 'bg-green-50', icon: '💰', small: true },
          { label: 'Chưa thu',
            value: stats.unpaid.toLocaleString('vi-VN') + 'đ',
            color: 'text-red-500', bg: 'bg-red-50', icon: '⚠️', small: true },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center text-base mb-2`}>
              {card.icon}
            </div>
            <p className={`font-semibold ${card.color} ${card.small ? 'text-sm' : 'text-2xl'}`}>
              {card.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* 2 cột bên dưới */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Leads mới nhất */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">🎯 Leads mới nhất</h3>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Chưa có lead nào</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentLeads.map((lead, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
                      {lead.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{lead.full_name}</p>
                      <p className="text-xs text-gray-400">{lead.phone} · {SOURCE_LABELS[lead.source]}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
                    {STATUS_LABELS[lead.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Học phí chưa thu */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">⚠️ Học phí chưa thu</h3>
          </div>
          {unpaidList.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Không có công nợ</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {unpaidList.map((p, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.students?.full_name}</p>
                    <p className="text-xs text-gray-400">{p.classes?.name || 'Chưa có lớp'}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-500">
                    {Number(p.final_amount || p.amount).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}