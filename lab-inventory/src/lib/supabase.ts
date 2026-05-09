import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Category = {
  id: string
  name: string
  created_at: string
}

export type Item = {
  id: string
  name: string
  category: string
  quantity: number
  description: string | null
  image_url: string | null
  file_urls: string[] | null
  created_at: string
  updated_at: string
}
