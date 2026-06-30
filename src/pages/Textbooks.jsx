// src/pages/Textbooks.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  X,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
  XCircle
} from 'lucide-react'

export default function Textbooks() {
  const isMobile = useIsMobile()
  const [textbooks, setTextbooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // add, edit, import, export
  const [editingTextbook, setEditingTextbook] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0
  })
  const [importExportData, setImportExportData] = useState({
    id: '',
    name: '',
    quantity: 0,
    changeAmount: 0
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchTextbooks()
  }, [])

  async function fetchTextbooks() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('textbooks')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      setTextbooks(data || [])
    } catch (error) {
      console.error('❌ Lỗi fetch textbooks:', error)
      alert(`Lỗi: ${error.message}`)
    }
    setLoading(false)
  }

  // Lọc theo tên
  const filtered = textbooks.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase())
  )

  // ==================== MODAL HANDLERS ====================

  function openAddModal() {
    setModalMode('add')
    setFormData({ name: '', quantity: 0 })
    setShowModal(true)
  }

  function openEditModal(textbook) {
    setModalMode('edit')
    setEditingTextbook(textbook)
    setFormData({
      name: textbook.name,
      quantity: textbook.quantity
    })
    setShowModal(true)
  }

  function openImportModal(textbook) {
    setModalMode('import')
    setEditingTextbook(textbook)
    setImportExportData({
      id: textbook.id,
      name: textbook.name,
      quantity: textbook.quantity,
      changeAmount: 0
    })
    setShowModal(true)
  }

  function openExportModal(textbook) {
    setModalMode('export')
    setEditingTextbook(textbook)
    setImportExportData({
      id: textbook.id,
      name: textbook.name,
      quantity: textbook.quantity,
      changeAmount: 0
    })
    setShowModal(true)
  }

  // ==================== SAVE HANDLERS ====================

  async function handleSave() {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên giáo trình!')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formData.name.trim(),
        quantity: parseInt(formData.quantity) || 0
      }

      let result
      if (modalMode === 'edit' && editingTextbook) {
        result = await supabase
          .from('textbooks')
          .update(payload)
          .eq('id', editingTextbook.id)
      } else {
        result = await supabase
          .from('textbooks')
          .insert(payload)
      }

      if (result.error) throw result.error

      setShowModal(false)
      fetchTextbooks()
      alert(modalMode === 'edit' ? '✅ Đã cập nhật giáo trình!' : '✅ Đã thêm giáo trình mới!')
      
    } catch (error) {
      console.error('❌ Lỗi save:', error)
      alert(`Lỗi: ${error.message}`)
    }
    setSaving(false)
  }

  async function handleImportExport() {
    const changeAmount = parseInt(importExportData.changeAmount) || 0
    
    if (changeAmount <= 0) {
      alert(modalMode === 'import' ? 'Vui lòng nhập số lượng nhập vào!' : 'Vui lòng nhập số lượng xuất ra!')
      return
    }

    setSaving(true)
    try {
      const newQuantity = modalMode === 'import' 
        ? importExportData.quantity + changeAmount
        : importExportData.quantity - changeAmount

      if (newQuantity < 0) {
        alert('Số lượng không đủ để xuất!')
        setSaving(false)
        return
      }

      const { error } = await supabase
        .from('textbooks')
        .update({ quantity: newQuantity })
        .eq('id', importExportData.id)

      if (error) throw error

      setShowModal(false)
      fetchTextbooks()
      alert(modalMode === 'import' 
        ? `✅ Đã nhập thêm ${changeAmount} quyển!` 
        : `✅ Đã xuất ${changeAmount} quyển!`
      )
      
    } catch (error) {
      console.error('❌ Lỗi:', error)
      alert(`Lỗi: ${error.message}`)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Bạn có chắc muốn xóa giáo trình này?')) return
    
    setDeleting(true)
    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('textbooks')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      fetchTextbooks()
      alert('✅ Đã xóa giáo trình!')
      
    } catch (error) {
      console.error('❌ Lỗi delete:', error)
      alert(`Lỗi: ${error.message}`)
    }
    setDeleting(false)
    setDeletingId(null)
  }

  // ==================== RENDER ====================

  // Render mobile card
  const renderMobileCard = (textbook) => {
    return (
      <div key={textbook.id} style={{
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #f3f4f6'
      }}>
        {/* Header: Tên + Số lượng */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: 600,
              fontSize: '16px',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <BookOpen size={16} color="#2563eb" />
              {textbook.name}
            </div>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 700,
              color: textbook.quantity === 0 ? '#ef4444' : textbook.quantity <= 5 ? '#f59e0b' : '#16a34a'
            }}>
              {textbook.quantity}
            </div>
            <div style={{
              fontSize: '10px',
              color: '#9ca3af'
            }}>
              quyển
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '6px'
        }}>
          <button
            onClick={() => openImportModal(textbook)}
            style={{
              padding: '6px 8px',
              fontSize: '11px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontWeight: 500
            }}
          >
            <Upload size={14} />
            Nhập
          </button>
          <button
            onClick={() => openExportModal(textbook)}
            disabled={textbook.quantity === 0}
            style={{
              padding: '6px 8px',
              fontSize: '11px',
              background: textbook.quantity > 0 ? '#f59e0b' : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: textbook.quantity > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontWeight: 500,
              opacity: textbook.quantity > 0 ? 1 : 0.5
            }}
          >
            <Download size={14} />
            Xuất
          </button>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => openEditModal(textbook)}
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: '11px',
                background: 'none',
                color: '#3b82f6',
                border: '1px solid #dbeafe',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => handleDelete(textbook.id)}
              disabled={deleting && deletingId === textbook.id}
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: '11px',
                background: 'none',
                color: '#ef4444',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                opacity: deleting && deletingId === textbook.id ? 0.6 : 1
              }}
            >
              {deleting && deletingId === textbook.id ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        </div>
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
            <BookOpen size={isMobile ? 20 : 24} color="#2563eb" />
            Giáo trình
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
            Tổng số: {textbooks.length} giáo trình
          </p>
        </div>
        <button
          onClick={openAddModal}
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
            width: isMobile ? '100%' : 'auto',
            justifyContent: 'center'
          }}
        >
          <Plus size={16} />
          Thêm mới
        </button>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '8px' : '12px',
        marginBottom: '16px'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }} />
          <input
            placeholder="Tìm kiếm giáo trình..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px 12px 8px 36px' : '8px 12px 8px 36px',
              fontSize: isMobile ? '13px' : '14px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={fetchTextbooks}
          style={{
            padding: isMobile ? '8px 12px' : '8px 16px',
            fontSize: isMobile ? '13px' : '14px',
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Mobile / Desktop View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
          <p>Đang tải...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <BookOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ color: '#6b7280' }}>Chưa có giáo trình nào</p>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
            {search ? 'Không tìm thấy kết quả phù hợp' : 'Hãy thêm giáo trình mới'}
          </p>
        </div>
      ) : isMobile ? (
        /* Mobile View - Cards */
        <div>
          {filtered.map(textbook => renderMobileCard(textbook))}
        </div>
      ) : (
        /* Desktop View - Table (bỏ cột Trạng thái) */
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'auto'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: isMobile ? '500px' : '100%'
            }}>
              <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280'
                  }}>
                    STT
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280'
                  }}>
                    Tên giáo trình
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280'
                  }}>
                    Số lượng
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280'
                  }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody style={{ borderTop: '1px solid #f3f4f6' }}>
                {filtered.map((t, index) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{
                      padding: '12px 16px',
                      color: '#6b7280'
                    }}>
                      {index + 1}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontWeight: 500,
                      color: '#1f2937'
                    }}>
                      {t.name}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: t.quantity === 0 ? '#ef4444' : t.quantity <= 5 ? '#f59e0b' : '#16a34a'
                    }}>
                      {t.quantity}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '4px',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => openImportModal(t)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Upload size={14} />
                          Nhập
                        </button>
                        <button
                          onClick={() => openExportModal(t)}
                          disabled={t.quantity === 0}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: t.quantity > 0 ? '#f59e0b' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: t.quantity > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: t.quantity > 0 ? 1 : 0.5
                          }}
                        >
                          <Download size={14} />
                          Xuất
                        </button>
                        <button
                          onClick={() => openEditModal(t)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: 'none',
                            color: '#3b82f6',
                            border: '1px solid #dbeafe',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deleting && deletingId === t.id}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: 'none',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: deleting && deletingId === t.id ? 0.6 : 1
                          }}
                        >
                          {deleting && deletingId === t.id ? (
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== MODAL ==================== */}
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
            maxWidth: '450px',
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
                <BookOpen size={20} color="#2563eb" />
                {modalMode === 'add' && 'Thêm giáo trình mới'}
                {modalMode === 'edit' && 'Sửa giáo trình'}
                {modalMode === 'import' && 'Nhập giáo trình'}
                {modalMode === 'export' && 'Xuất giáo trình'}
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
            {(modalMode === 'add' || modalMode === 'edit') && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    Tên giáo trình *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="VD: 1A, 1B, Skill, TOEIC..."
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
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    Số lượng
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                    min="0"
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
              </div>
            )}

            {(modalMode === 'import' || modalMode === 'export') && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  padding: '12px',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                    <strong>Giáo trình:</strong> {importExportData.name}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
                    <strong>Số lượng hiện có:</strong> {importExportData.quantity} quyển
                  </p>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    {modalMode === 'import' ? 'Số lượng nhập vào' : 'Số lượng xuất ra'} *
                  </label>
                  <input
                    type="number"
                    value={importExportData.changeAmount}
                    onChange={(e) => setImportExportData({
                      ...importExportData,
                      changeAmount: parseInt(e.target.value) || 0
                    })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                  {modalMode === 'export' && (
                    <p style={{
                      fontSize: '11px',
                      color: '#ef4444',
                      marginTop: '4px'
                    }}>
                      ⚠️ Số lượng xuất không được vượt quá số lượng hiện có
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '20px'
            }}>
              <button
                onClick={modalMode === 'import' || modalMode === 'export' ? handleImportExport : handleSave}
                disabled={saving}
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
                  opacity: saving ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {saving ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Save size={16} />
                )}
                {saving ? 'Đang lưu...' : 'Lưu'}
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

      {/* Animation styles */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}