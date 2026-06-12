import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { AssetCategory } from '@/lib/database.types'

export type Asset = {
  id: string
  category: AssetCategory
  title: string
  description: string | null
  file_url: string | null
  caption_text: string | null
  course: string | null
  format: string | null
}

export async function getAssets(): Promise<Asset[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('assets')
    .select('id, category, title, description, file_url, caption_text, course, format')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}
