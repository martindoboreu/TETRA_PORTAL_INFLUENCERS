import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ResolvedRange } from './range'

// All helpers below assume the caller is the partner whose data we want;
// RLS scopes rows to auth.uid() automatically.

export async function getPartnerKpis(partnerId: string, range: ResolvedRange) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('partner_kpis_in_range', {
    p_partner: partnerId,
    p_from: range.from,
    p_to: range.to,
  })
  if (error) throw error
  return data?.[0] ?? {
    cliques: 0,
    cliques_delta: 0,
    leads: 0,
    leads_delta: 0,
    conversoes: 0,
    conversoes_delta: 0,
    taxa_conversao: 0,
    taxa_conversao_delta: 0,
    comissao: 0,
    comissao_delta: 0,
    a_receber: 0,
  }
}

export async function getPartnerChart(partnerId: string, range: ResolvedRange) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('partner_chart_in_range', {
    p_partner: partnerId,
    p_from: range.from,
    p_to: range.to,
    p_bucket: range.bucket,
  })
  if (error) throw error
  return data ?? []
}

export async function getPartnerFunnel(partnerId: string, range: ResolvedRange) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('partner_funnel_in_range', {
    p_partner: partnerId,
    p_from: range.from,
    p_to: range.to,
  })
  if (error) throw error
  return data?.[0] ?? { cliques: 0, leads: 0, matriculas: 0, pagos: 0 }
}

export async function getPartnerLinkPerformance(partnerId: string, range: ResolvedRange) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('partner_link_performance_in_range', {
    p_partner: partnerId,
    p_from: range.from,
    p_to: range.to,
  })
  if (error) throw error
  return data ?? []
}

export async function getPartnerRecentConversions(partnerId: string, limit = 8) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversions')
    .select('id, buyer_masked, course, commission, status, created_at')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getPartnerLinks(partnerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('links')
    .select('id, label, slug, discount_code, status, created_at')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getPartnerConversions(
  partnerId: string,
  range: ResolvedRange,
  opts: { search?: string; status?: 'todos' | 'pago' | 'confirmado' | 'reembolsado' } = {}
) {
  const supabase = await createClient()
  let q = supabase
    .from('conversions')
    .select('id, buyer_masked, course, amount, commission, status, created_at')
    .eq('partner_id', partnerId)
    .gte('created_at', range.from)
    .lt('created_at', range.to)
    .order('created_at', { ascending: false })

  if (opts.status && opts.status !== 'todos') q = q.eq('status', opts.status)
  if (opts.search?.trim()) {
    const term = `%${opts.search.trim()}%`
    q = q.or(`buyer_masked.ilike.${term},course.ilike.${term}`)
  }

  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function getPartnerPayouts(partnerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payouts')
    .select('id, amount, method, status, reference_period, paid_at, created_at')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getPartnerProfile(partnerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, handle, avatar_initials, tier, commission_rate, follower_count, pix_key, status, society_tier')
    .eq('id', partnerId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getPartnerIntegrations(partnerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('integrations')
    .select('id, provider, status, external_handle, follower_count, connected_at, last_synced_at')
    .eq('partner_id', partnerId)
    .order('provider', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getProgramSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('program_settings')
    .select('default_commission_rate, next_payout_date')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('not authenticated')
  return user
}
