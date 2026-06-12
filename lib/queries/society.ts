import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { normalizeTierKey } from '@/lib/society'
import type { SocietyTierKey } from '@/lib/database.types'

export interface PartnerEvaluation {
  approved_content_count: number
  compliance_score: number
  content_quality_score: number
  responsiveness_score: number
  notes: string | null
  updated_at: string | null
}

export interface SocietyCriteriaValues {
  attributedRevenue: number
  campaignParticipation: number
  approvedContentCount: number
  complianceScore: number
  contentQualityScore: number
  responsivenessScore: number
}

export interface PartnerSociety {
  tier: SocietyTierKey
  sinceDate: string | null
  commissionRate: number
  evaluation: PartnerEvaluation | null
  criteria: SocietyCriteriaValues
}

const EMPTY_EVALUATION: SocietyCriteriaValues = {
  attributedRevenue: 0,
  campaignParticipation: 0,
  approvedContentCount: 0,
  complianceScore: 0,
  contentQualityScore: 0,
  responsivenessScore: 0,
}

// All Society tier rows (admin-editable name + commission rate).
export async function getSocietyTiers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('society_tiers')
    .select('id, key, name, description, commission_rate, invite_only, sort_order')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

// Full Society snapshot for one partner: status, admin evaluation, and the
// criteria computed from existing conversions / campaign participation.
export async function getPartnerSociety(partnerId: string): Promise<PartnerSociety> {
  const supabase = await createClient()

  const [profileRes, evalRes, convRes, campRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('society_tier, commission_rate, created_at')
      .eq('id', partnerId)
      .maybeSingle(),
    supabase
      .from('partner_evaluations')
      .select('approved_content_count, compliance_score, content_quality_score, responsiveness_score, notes, updated_at')
      .eq('partner_id', partnerId)
      .maybeSingle(),
    supabase
      .from('conversions')
      .select('commission, status')
      .eq('partner_id', partnerId)
      .in('status', ['confirmado', 'pago']),
    supabase
      .from('campaign_participants')
      .select('id, status')
      .eq('partner_id', partnerId)
      .in('status', ['aceito', 'entregue']),
  ])

  if (profileRes.error) throw profileRes.error
  if (evalRes.error) throw evalRes.error
  if (convRes.error) throw convRes.error
  if (campRes.error) throw campRes.error

  const tier = normalizeTierKey(profileRes.data?.society_tier ?? null)
  const attributedRevenue = (convRes.data ?? []).reduce(
    (sum, c) => sum + Number(c.commission ?? 0),
    0
  )
  const campaignParticipation = (campRes.data ?? []).length
  const evaluation = evalRes.data ?? null

  return {
    tier,
    sinceDate: profileRes.data?.created_at ?? null,
    commissionRate: Number(profileRes.data?.commission_rate ?? 0),
    evaluation,
    criteria: {
      ...EMPTY_EVALUATION,
      attributedRevenue,
      campaignParticipation,
      approvedContentCount: evaluation?.approved_content_count ?? 0,
      complianceScore: evaluation?.compliance_score ?? 0,
      contentQualityScore: evaluation?.content_quality_score ?? 0,
      responsivenessScore: evaluation?.responsiveness_score ?? 0,
    },
  }
}
