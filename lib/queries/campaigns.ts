import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { CampaignParticipantStatus } from '@/lib/database.types'

export type PartnerCampaign = {
  id: string
  title: string
  subtitle: string | null
  brief: string | null
  commission_note: string | null
  content_requirements: string | null
  reward_highlight: string | null
  deadline: string | null
  participation_status: CampaignParticipantStatus | null
}

/** Active campaigns with this partner's participation status merged in. */
export async function getPartnerCampaigns(partnerId: string): Promise<PartnerCampaign[]> {
  const supabase = await createClient()

  const [{ data: campaigns, error }, { data: participants }] = await Promise.all([
    supabase
      .from('campaigns')
      .select('id, title, subtitle, brief, commission_note, content_requirements, reward_highlight, deadline')
      .eq('status', 'ativa')
      .order('sort_order', { ascending: true }),
    supabase
      .from('campaign_participants')
      .select('campaign_id, status')
      .eq('partner_id', partnerId),
  ])

  if (error) throw error

  const statusByCampaign = new Map<string, CampaignParticipantStatus>()
  for (const p of participants ?? []) statusByCampaign.set(p.campaign_id, p.status)

  return (campaigns ?? []).map((c) => ({
    ...c,
    participation_status: statusByCampaign.get(c.id) ?? null,
  }))
}

export async function getPartnerCampaign(
  campaignId: string,
  partnerId: string
): Promise<PartnerCampaign | null> {
  const supabase = await createClient()

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, title, subtitle, brief, commission_note, content_requirements, reward_highlight, deadline, status')
    .eq('id', campaignId)
    .maybeSingle()

  if (error) throw error
  if (!campaign || campaign.status !== 'ativa') return null

  const { data: participant } = await supabase
    .from('campaign_participants')
    .select('status')
    .eq('campaign_id', campaignId)
    .eq('partner_id', partnerId)
    .maybeSingle()

  return {
    id: campaign.id,
    title: campaign.title,
    subtitle: campaign.subtitle,
    brief: campaign.brief,
    commission_note: campaign.commission_note,
    content_requirements: campaign.content_requirements,
    reward_highlight: campaign.reward_highlight,
    deadline: campaign.deadline,
    participation_status: participant?.status ?? null,
  }
}
