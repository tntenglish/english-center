// src/constants/navigation.js
import {
  LayoutDashboard,  // Dashboard
  Target,           // Leads
  Users,            // Học viên
  School,           // Lớp học
  UserCog,          // Giáo viên
  CheckSquare,      // Điểm danh
  TrendingUp,       // Doanh thu
  ShieldCheck,      // Phân quyền
} from 'lucide-react'

// Danh sách menu chính
export const NAV_ITEMS = [
  { 
    to: '/', 
    label: 'Tổng quan', 
    icon: LayoutDashboard, 
    adminOnly: false 
  },
  { 
    to: '/leads', 
    label: 'Leads', 
    icon: Target, 
    adminOnly: false 
  },
  { 
    to: '/students', 
    label: 'Học viên', 
    icon: Users, 
    adminOnly: false 
  },
  { 
    to: '/classes', 
    label: 'Lớp học', 
    icon: School, 
    adminOnly: false 
  },
  { 
    to: '/teachers', 
    label: 'Giáo viên', 
    icon: UserCog, 
    adminOnly: false 
  },
  { 
    to: '/attendance', 
    label: 'Điểm danh', 
    icon: CheckSquare, 
    adminOnly: false 
  },
  { 
    to: '/revenue', 
    label: 'Doanh thu', 
    icon: TrendingUp, 
    adminOnly: true 
  },
  { 
    to: '/users', 
    label: 'Phân quyền', 
    icon: ShieldCheck, 
    adminOnly: true 
  },
]

// Menu bottom navigation (dùng chung với menu chính)
export const BOTTOM_NAV = NAV_ITEMS