// src/hooks/useIsMobile.js
import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 768) {
  // Kiểm tra window có tồn tại không (để tránh lỗi khi SSR)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= breakpoint
    }
    return false // Mặc định false nếu không có window
  })

  useEffect(() => {
    // Kiểm tra lại để đảm bảo an toàn
    if (typeof window === 'undefined') return

    // Cập nhật state khi resize
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint)
    }

    // Thêm event listener
    window.addEventListener('resize', handleResize)

    // Cleanup: xóa event listener khi component unmount
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [breakpoint]) // Thêm breakpoint vào dependency

  return isMobile
}