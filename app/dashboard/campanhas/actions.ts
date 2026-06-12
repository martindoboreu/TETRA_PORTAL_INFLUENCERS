'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type CampaignActionState = { ok: boolean; error: string | null }

export async function acceptCampaign(
  _prev: CampaignActionState,
  formData: FormData
): Promise<CampaignActionState> {
  const campaignId = String(formData.get('campaign_id') ?? '')
  if (!campaignId) return { ok: false, error: 'Campanha inválida.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sessão expirada. Faça login novamente.' }

  // Confirm the campaign is active before joining.
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, status')
    .eq('id', campaignId)
    .maybeSingle()
  if (!campaign || campaign.status !== 'ativa') {
    return { ok: false, error: 'Esta campanha não está disponível.' }
  }

  const { error } = await supabase
    .from('campaign_participants')
    .upsert(
      { campaign_id: campaignId, partner_id: user.id, status: 'aceito' },
      { onConflict: 'campaign_id,partner_id' }
    )
  if (error) return { ok: false, error: 'Não foi possível entrar na campanha. Tente novamente.' }

  revalidatePath('/dashboard/campanhas')
  revalidatePath(`/dashboard/campanhas/${campaignId}`)
  return { ok: true, error: null }
}
