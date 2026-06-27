import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'

const STATUS_LABELS = {
  chua_thanh_toan: { label: 'Chưa thanh toán', color: 'bg-red-100 text-red-700' },
  da_thanh_toan:   { label: 'Đã thanh toán',   color: 'bg-green-100 text-green-700' },
  hoan_tien:       { label: 'Hoàn tiền',        color: 'bg-gray-100 text-gray-600' },
}

const METHOD_LABELS = {
  tien_mat:      'Tiền mặt',
  chuyen_khoan:  'Chuyển khoản',
  the:           'Thẻ',
  khac:          'Khác',
}

const EMPTY_FORM = {
  student_id: '', class_id: '', amount: '',
  discount: '0', method: 'tien_mat',
  status: 'chua_thanh_toan', note: '', paid_at: '',
}

export default function Payments() {
  const isMobile = useIsMobile()
  const [payments, setPayments] = useState([])
  const [students, setStudents] = useState([])
  const [classes, setClasses]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [syncing, setSyncing]   = useState(false)

  // Tính toán thống kê
  const totalPaid = payments
    .filter(p => p.status === 'da_thanh_toan')
    .reduce((sum, p) => sum + Number(p.final_amount || p.amount), 0)

  const totalUnpaid = payments
    .filter(p => p.status === 'chua_thanh_toan')
    .reduce((sum, p) => sum + Number(p.final_amount || p.amount), 0)

  const totalPayments = payments.length

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [p, s, c] = await Promise.all([
        supabase.from('payments').select(`
          *, 
          students(full_name, phone, tuition_paid), 
          classes(name)
        `).order('created_at', { ascending: false }),
        supabase.from('students').select('id, full_name, tuition_paid').eq('status', 'dang_hoc'),
        supabase.from('classes').select('id, name').eq('status', 'dang_hoc'),
      ])
      
      setPayments(p.data || [])
      setStudents(s.data || [])
      setClasses(c.data || [])
    } catch (error) {
      console.error('Lỗi fetchAll:', error)
    }
    setLoading(false)
  }

  // Hàm đồng bộ: Cập nhật tuition_paid cho học viên dựa trên payments
  async function syncStudentPayment(studentId) {
    try {
      // Tính tổng số tiền đã thanh toán của học viên
      const { data: studentPayments } = await supabase
        .from('payments')
        .select('final_amount')
        .eq('student_id', studentId)
        .eq('status', 'da_thanh_toan')

      const totalPaidAmount = studentPayments?.reduce((sum, p) => sum + Number(p.final_amount), 0) || 0

      // Cập nhật tuition_paid cho học viên
      await supabase
        .from('students')
        .update({ 
          tuition_paid: totalPaidAmount,
          tuition_fee: totalPaidAmount
        })
        .eq('id', studentId)

      return totalPaidAmount
    } catch (error) {
      console.error('Lỗi syncStudentPayment:', error)
      return 0
    }
  }

  async function savePayment() {
    if (!form.student_id) {
      alert('Vui lòng chọn học viên!')
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ!')
      return
    }
    
    setSaving(true)
    try {
      const finalAmount = Number(form.amount) - Number(form.discount || 0)
      const payload = {
        student_id: form.student_id,
        class_id: form.class_id || null,
        amount: Number(form.amount),
        discount: Number(form.discount || 0),
        final_amount: finalAmount,
        method: form.method || 'tien_mat',
        status: form.status || 'chua_thanh_toan',
        note: form.note || '',
        paid_at: form.status === 'da_thanh_toan' ? new Date().toISOString() : null
      }

      let result
      if (form.id) {
        result = await supabase.from('payments').update(payload).eq('id', form.id)
      } else {
        result = await supabase.from('payments').insert(payload)
      }

      if (result.error) {
        alert(`❌ Lỗi: ${result.error.message}`)
        setSaving(false)
        return
      }

      // Đồng bộ tuition_paid cho học viên
      await syncStudentPayment(form.student_id)

      setSaving(false)
      setShowForm(false)
      setForm(EMPTY_FORM)
      
      await fetchAll()
      alert('✅ Đã lưu hoá đơn và cập nhật học phí!')

    } catch (error) {
      alert(`❌ Lỗi: ${error.message}`)
      setSaving(false)
    }
  }

  async function deletePayment(id) {
    if (!confirm('Xoá hoá đơn này?')) return
    
    try {
      const { data: paymentData } = await supabase
        .from('payments')
        .select('student_id, final_amount, status')
        .eq('id', id)
        .single()

      await supabase.from('payments').delete().eq('id', id)

      // Đồng bộ lại tuition_paid cho học viên
      if (paymentData) {
        await syncStudentPayment(paymentData.student_id)
      }

      await fetchAll()
      alert('✅ Đã xóa hoá đơn!')
    } catch (error) {
      alert(`❌ Lỗi: ${error.message}`)
    }
  }

  async function markPaid(payment) {
    try {
      const finalAmount = Number(payment.final_amount || payment.amount)
      
      await supabase
        .from('payments')
        .update({
          status: 'da_thanh_toan',
          paid_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      // Đồng bộ tuition_paid cho học viên
      await syncStudentPayment(payment.student_id)

      await fetchAll()
      alert('✅ Đã thu tiền và cập nhật học phí!')
    } catch (error) {
      alert(`❌ Lỗi: ${error.message}`)
    }
  }

  // Hàm cập nhật trạng thái thanh toán từ học viên
  async function toggleStudentPayment(studentId, currentStatus) {
    try {
      const newStatus = !currentStatus
      
      if (newStatus) {
        // Nếu tick "Đã đóng", tạo hóa đơn tự động
        const { data: student } = await supabase
          .from('students')
          .select('full_name, tuition_fee')
          .eq('id', studentId)
          .single()

        // Kiểm tra xem đã có hóa đơn cho học viên này chưa
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id')
          .eq('student_id', studentId)
          .eq('status', 'da_thanh_toan')
          .maybeSingle()

        if (!existingPayment && student) {
          // Tạo hóa đơn mới
          const amount = student.tuition_fee || 0
          await supabase
            .from('payments')
            .insert({
              student_id: studentId,
              amount: amount,
              final_amount: amount,
              status: 'da_thanh_toan',
              method: 'tien_mat',
              paid_at: new Date().toISOString(),
              note: 'Tự động từ tick "Đã đóng"'
            })
        }

        // Cập nhật tuition_paid
        await supabase
          .from('students')
          .update({ 
            tuition_paid: 1,
            tuition_fee: 1
          })
          .eq('id', studentId)

        // Đồng bộ lại
        await syncStudentPayment(studentId)

      } else {
        // Nếu bỏ tick "Đã đóng", xóa hóa đơn tương ứng
        await supabase
          .from('payments')
          .delete()
          .eq('student_id', studentId)
          .eq('status', 'da_thanh_toan')

        await supabase
          .from('students')
          .update({ 
            tuition_paid: 0,
            tuition_fee: 0
          })
          .eq('id', studentId)
      }

      await fetchAll()
      alert('✅ Đã cập nhật trạng thái học phí!')
    } catch (error) {
      alert(`❌ Lỗi: ${error.message}`)
    }
  }

  const filtered = payments.filter(p => {
    const matchSearch = p.students?.full_name?.toLowerCase().includes(search.toLowerCase())
      || p.students?.phone?.includes(search)
    const matchStatus = filterStatus ? p.status === filterStatus : true
    return matchSearch && matchStatus
  })

  const renderMobileCard = (payment) => (
    <div key={payment.id} style={{
      background: 'white',
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #f3f4f6'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px', color: '#1f2937' }}>
            {payment.students?.full_name}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            📱 {payment.students?.phone || '—'}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[payment.status]?.color}`}>
          {STATUS_LABELS[payment.status]?.label}
        </span>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
        fontSize: '12px',
        color: '#6b7280',
        paddingTop: '8px',
        borderTop: '1px solid #f3f4f6'
      }}>
        <div>🏫 {payment.classes?.name || '—'}</div>
        <div>💰 {Number(payment.amount).toLocaleString('vi-VN')}đ</div>
        <div>📉 {payment.discount > 0 ? Number(payment.discount).toLocaleString('vi-VN') + 'đ' : '—'}</div>
        <div style={{ fontWeight: 600, color: '#1f2937' }}>
          💵 {Number(payment.final_amount || payment.amount).toLocaleString('vi-VN')}đ
        </div>
        <div style={{ gridColumn: '1/3', fontSize: '11px', color: '#9ca3af' }}>
          {METHOD_LABELS[payment.method] || payment.method}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
        {payment.status === 'chua_thanh_toan' && (
          <button 
            onClick={() => markPaid(payment)}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '11px',
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Thu tiền
          </button>
        )}
        <button 
          onClick={() => { 
            setForm({
              ...payment, 
              class_id: payment.class_id || '', 
              paid_at: payment.paid_at || '',
              amount: payment.amount || '',
              discount: payment.discount || '0'
            }); 
            setShowForm(true) 
          }}
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
          onClick={() => deletePayment(payment.id)}
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
            Quản lý Học phí
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
            Thu chi và công nợ
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
          + Tạo hoá đơn
        </button>
      </div>

      {/* Thống kê */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
        gap: isMobile ? '8px' : '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: isMobile ? '12px' : '16px'
        }}>
          <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Đã thu</p>
          <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 600, color: '#16a34a' }}>
            {totalPaid.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: isMobile ? '12px' : '16px'
        }}>
          <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Chưa thu</p>
          <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 600, color: '#ef4444' }}>
            {totalUnpaid.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: isMobile ? '12px' : '16px'
        }}>
          <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Tổng hoá đơn</p>
          <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 600, color: '#1f2937' }}>
            {totalPayments}
          </p>
        </div>
      </div>

      {/* Search và Filter */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '8px' : '12px',
        marginBottom: '16px'
      }}>
        <input
          placeholder="Tìm tên, SĐT học viên..."
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

      {/* Danh sách hóa đơn */}
      {isMobile ? (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Chưa có hoá đơn nào</div>
          ) : (
            filtered.map(payment => renderMobileCard(payment))
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
                {['Học viên','Lớp học','Học phí','Giảm giá','Thực thu','Hình thức','Trạng thái','Thao tác'].map(h => (
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
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Chưa có hoá đơn nào</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontWeight: 500, color: '#1f2937', margin: 0 }}>{p.students?.full_name}</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{p.students?.phone}</p>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px' }}>{p.classes?.name || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#1f2937' }}>
                    {Number(p.amount).toLocaleString('vi-VN')}đ
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                    {p.discount > 0 ? Number(p.discount).toLocaleString('vi-VN') + 'đ' : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1f2937' }}>
                    {Number(p.final_amount || p.amount).toLocaleString('vi-VN')}đ
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px' }}>
                    {METHOD_LABELS[p.method] || p.method}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[p.status]?.color}`}>
                      {STATUS_LABELS[p.status]?.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {p.status === 'chua_thanh_toan' && (
                        <button 
                          onClick={() => markPaid(p)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            background: '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          Thu tiền
                        </button>
                      )}
                      <button 
                        onClick={() => { 
                          setForm({
                            ...p, 
                            class_id: p.class_id || '', 
                            paid_at: p.paid_at || '',
                            amount: p.amount || '',
                            discount: p.discount || '0'
                          }); 
                          setShowForm(true) 
                        }}
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
                        onClick={() => deletePayment(p.id)}
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

      {/* Form tạo hóa đơn */}
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
              {form.id ? 'Cập nhật hoá đơn' : 'Tạo hoá đơn mới'}
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? '10px' : '12px'
            }}>
              <div style={{ gridColumn: isMobile ? '1' : '1/3' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Học viên *</label>
                <select 
                  value={form.student_id} 
                  onChange={e => setForm({...form, student_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Chọn học viên --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1/3' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Lớp học</label>
                <select 
                  value={form.class_id} 
                  onChange={e => setForm({...form, class_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Học phí (đ) *</label>
                <input 
                  type="number" 
                  value={form.amount} 
                  onChange={e => setForm({...form, amount: e.target.value})}
                  placeholder="VD: 3500000"
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
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Giảm giá (đ)</label>
                <input 
                  type="number" 
                  value={form.discount} 
                  onChange={e => setForm({...form, discount: e.target.value})}
                  placeholder="0"
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
              {form.amount && (
                <div style={{ gridColumn: isMobile ? '1' : '1/3' }}>
                  <div style={{
                    background: '#eff6ff',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '14px'
                  }}>
                    <span style={{ color: '#6b7280' }}>Thực thu: </span>
                    <span style={{ fontWeight: 600, color: '#1d4ed8' }}>
                      {(Number(form.amount) - Number(form.discount || 0)).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Hình thức</label>
                <select 
                  value={form.method} 
                  onChange={e => setForm({...form, method: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: isMobile ? '14px' : '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                >
                  {Object.entries(METHOD_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
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
                onClick={savePayment} 
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