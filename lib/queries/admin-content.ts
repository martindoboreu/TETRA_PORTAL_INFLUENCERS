import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/queries/admin'
import type { AssetCategory, CampaignStatus } from '@/lib/database.types'

export type AdminCampaign = {
  id: string
  title: string
  subtitle: string | null
  status: CampaignStatus
  deadline: string | null
  participant_count: number
  accepted_count: number
}

export async function getAdminCampaigns(): Promise<AdminCampaign[]> {
  await requireAdmin()
  const supabase = await createClient()

  const [{ data: campaigns, error }, { data: participants }] = await Promise.all([
    supabase
      .from('campaigns')
      .select('id, title, subtitle, status, deadline')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase.from('campaign_participants').select('campaign_id, status'),
  ])

  if (error) throw error

  const counts = new Map<string, { total: number; accepted: number }>()
  for (const p of participants ?? []) {
    const entry = counts.get(p.campaign_id) ?? { total: 0, accepted: 0 }
    entry.total += 1
    if (p.status === 'aceito' || p.status === 'entregue') entry.accepted += 1
    counts.set(p.campaign_id, entry)
  }

  return (campaigns ?? []).map((c) => ({
    ...c,
    participant_count: counts.get(c.id)?.total ?? 0,
    accepted_count: counts.get(c.id)?.accepted ?? 0,
  }))
}

export type AdminAsset = {
  id: string
  category: AssetCategory
  title: string
  description: string | null
  course: string | null
  format: string | null
  caption_text: string | null
  file_url: string | null
}

export async function getAdminAssets(): Promise<AdminAsset[]> {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('assets')
    .select('id, category, title, description, course, format, caption_text, file_url')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}
