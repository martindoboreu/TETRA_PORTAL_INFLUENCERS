import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/queries/admin'

export type PartnerApplication = {
  id: string
  full_name: string | null
  handle: string | null
  avatar_initials: string | null
  pix_key: string | null
  email: string | null
  follower_count: number
  primary_social: string | null
  application_pitch: string | null
  created_at: string
  integrations: {
    provider: string
    external_handle: string | null
    follower_count: number
  }[]
}

/** Pending partner signups with e-mail (service role) for admin review. */
export async function getPendingApplications(): Promise<PartnerApplication[]> {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, handle, avatar_initials, pix_key, follower_count, primary_social, application_pitch, created_at')
    .eq('role', 'partner')
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!profiles?.length) return []

  const ids = profiles.map((p) => p.id)

  const [{ data: integrations }, { data: authData }] = await Promise.all([
    admin
      .from('integrations')
      .select('partner_id, provider, external_handle, follower_count')
      .in('partner_id', ids),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const emailById = new Map<string, string>()
  for (const u of authData.users ?? []) {
    if (u.email) emailById.set(u.id, u.email)
  }

  const integrationsByPartner = new Map<string, PartnerApplication['integrations']>()
  for (const row of integrations ?? []) {
    const list = integrationsByPartner.get(row.partner_id) ?? []
    list.push({
      provider: row.provider,
      external_handle: row.external_handle,
      follower_count: row.follower_count,
    })
    integrationsByPartner.set(row.partner_id, list)
  }

  return profiles.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    handle: p.handle,
    avatar_initials: p.avatar_initials,
    pix_key: p.pix_key,
    email: emailById.get(p.id) ?? null,
    follower_count: p.follower_count ?? 0,
    primary_social: p.primary_social ?? null,
    application_pitch: p.application_pitch ?? null,
    created_at: p.created_at,
    integrations: integrationsByPartner.get(p.id) ?? [],
  }))
}
