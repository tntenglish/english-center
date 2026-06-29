// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// ⭐ QUAN TRỌNG: Kiểm tra biến môi trường
if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is not defined!')
  console.error('Please add VITE_SUPABASE_URL to your environment variables.')
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not defined!')
  console.error('Please add VITE_SUPABASE_ANON_KEY to your environment variables.')
}

// Client thông thường (dùng anon key)
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
)

// Client admin (dùng service role key) - Chỉ dùng cho admin
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

export async function getProfile() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Error getting user:', userError)
      return null
    }
    
    if (!user) return null
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('❌ Error getting profile:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('❌ Error in getProfile:', error)
    return null
  }
}