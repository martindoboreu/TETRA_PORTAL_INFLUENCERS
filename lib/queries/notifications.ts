import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { NotificationType } from '@/lib/database.types'

export type PartnerNotification = {
  id: string
  type: NotificationType
  title: string
  body: string | null
  href: string | null
  read_at: string | null
  created_at: string
}

export async function getPartnerNotifications(
  partnerId: string,
  limit = 12
): Promise<PartnerNotification[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, href, read_at, created_at')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}
