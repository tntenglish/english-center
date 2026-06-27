import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Client thông thường (dùng anon key) - Cho các hoạt động thông thường
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client admin (dùng service role key) - Chỉ dùng cho admin (tạo user, xóa user,...)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data
}