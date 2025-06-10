import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// 类型定义
export interface User {
  id: string
  email: string
  user_metadata: {
    display_name?: string
  }
}

export interface Bill {
  id: string
  owner_id: string
  name: string
  description?: string
  created_at: string
}

export interface BillMember {
  id: string
  bill_id: string
  user_id: string
  permission: 'edit_add' | 'add_only' | 'view_only'
  created_at: string
}

export interface Category {
  id: string
  bill_id: string
  user_id: string
  name: string
  type: 'income' | 'expense'
  created_at: string
}

export interface Transaction {
  id: string
  bill_id: string
  user_id: string
  type: 'income' | 'expense'
  date: string
  item: string
  amount: number
  person?: string
  note?: string
  category_id?: string
  created_at: string
}

export interface AILog {
  id: string
  bill_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
} 