import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { normalizeTierKey } from '@/lib/society'
import type { SocietyTierKey } from '@/lib/database.types'
import type { ResolvedRange } from './range'

type PartnerEvaluationsRow = {
  partner_id: string
  approved_content_count: number
  compliance_score: number
  content_quality_score: number
  responsiveness_score: number
  notes: string | null
  updated_at: string
}

// Admins call these through their own session; RLS grants admins access to all rows
// (see is_admin() policies in 0002_rls.sql), so no service-role client is needed here.

export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('not authenticated')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') throw new Error('forbidden')
  return user
}

export async function getAdminKpis(range: ResolvedRange) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_program_kpis_in_range', {
    p_from: range.from,
    p_to: range.to,
  })
  if (error) throw error
  return (
    data?.[0] ?? {
      cliques: 0,
      leads: 0,
      conversoes: 0,
      taxa_conversao: 0,
      comissao_total: 0,
      a_repassar: 0,
      parceiros_ativos: 0,
    }
  )
}

export async function getAdminChart(range: ResolvedRange) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_chart_in_range', {
    p_from: range.from,
    p_to: range.to,
    p_bucket: range.bucket,
  })
  if (error) throw error
  return data ?? []
}

export async function getPartnerRollup(range: ResolvedRange) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_partner_rollup_in_range', {
    p_from: range.from,
    p_to: range.to,
  })
  if (error) throw error
  return data ?? []
}

export async function getAdminRecentConversions(limit = 10) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversions')
    .select('id, partner_id, buyer_masked, course, amount, commission, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

// Map of partner_id -> display name/handle, used to label cross-partner feeds.
export async function getPartnerLabels() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, handle, avatar_initials')
    .eq('role', 'partner')
  if (error) throw error
  const map = new Map<string, { full_name: string | null; handle: string | null; avatar_initials: string | null }>()
  for (const p of data ?? []) {
    map.set(p.id, { full_name: p.full_name, handle: p.handle, avatar_initials: p.avatar_initials })
  }
  return map
}

export async function getPendingPartners() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, handle, avatar_initials, tier, commission_rate, follower_count, created_at')
    .eq('role', 'partner')
    .eq('status', 'pendente')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// --- per-partner detail (admin) ---

export async function getPartnerDetail(partnerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, handle, avatar_initials, tier, commission_rate, follower_count, pix_key, status, created_at, role, society_tier')
    .eq('id', partnerId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getPartnerIntegrationsAdmin(partnerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('integrations')
    .select('id, provider, status, external_handle, follower_count, last_synced_at')
    .eq('partner_id', partnerId)
    .order('provider', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getPartnerLinksAdmin(partnerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('links')
    .select('id, label, slug, discount_code, status, created_at')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getPartnerConversionsAdmin(partnerId: string, limit = 20) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversions')
    .select('id, buyer_masked, course, amount, commission, status, created_at')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getPartnerPayoutsAdmin(partnerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payouts')
    .select('id, amount, method, status, reference_period, paid_at, created_at')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getAdminSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('program_settings')
    .select('default_commission_rate, next_payout_date, reward_cycle_start, reward_cycle_label')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getPartnerFollowerMap() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, follower_count')
    .eq('role', 'partner')
  if (error) throw error
  const map = new Map<string, number>()
  for (const p of data ?? []) map.set(p.id, p.follower_count)
  return map
}

// Tetra Society — admin views over partner statuses + evaluations.

export async function getPartnerSocietyMap() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, society_tier')
    .eq('role', 'partner')
  if (error) throw error
  const map = new Map<string, SocietyTierKey>()
  for (const p of data ?? []) map.set(p.id, normalizeTierKey(p.society_tier))
  return map
}

export async function getPartnerEvaluationsMap() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('partner_evaluations')
    .select('partner_id, approved_content_count, compliance_score, content_quality_score, responsiveness_score, notes, updated_at')
  if (error) throw error
  const map = new Map<string, PartnerEvaluationsRow>()
  for (const e of data ?? []) map.set(e.partner_id, e)
  return map
}

export async function getPartnerEvaluation(partnerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('partner_evaluations')
    .select('partner_id, approved_content_count, compliance_score, content_quality_score, responsiveness_score, notes, updated_at')
    .eq('partner_id', partnerId)
    .maybeSingle()
  if (error) throw error
  return data
}
