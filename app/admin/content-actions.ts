'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AssetCategory, CampaignStatus, NotificationType } from '@/lib/database.types'

export type ContentActionState = { ok: boolean; error: string | null }

async function assertAdmin() {
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
  return supabase
}

const CAMPAIGN_STATUSES: CampaignStatus[] = ['rascunho', 'ativa', 'encerrada']
const ASSET_CATEGORIES: AssetCategory[] = ['criativo', 'legenda', 'guia', 'exemplo']

// Notify all active partners (used when a campaign goes live).
async function notifyActivePartners(
  supabase: Awaited<ReturnType<typeof assertAdmin>>,
  payload: { type: NotificationType; title: string; body: string; href: string }
) {
  const { data: partners } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'partner')
    .eq('status', 'ativo')
  if (!partners?.length) return
  await supabase.from('notifications').insert(
    partners.map((p) => ({
      partner_id: p.id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      href: payload.href,
    }))
  )
}

export async function createCampaign(
  _prev: ContentActionState,
  formData: FormData
): Promise<ContentActionState> {
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { ok: false, error: 'Informe um título.' }

  const status = String(formData.get('status') ?? 'rascunho') as CampaignStatus
  const deadlineRaw = String(formData.get('deadline') ?? '').trim()

  const supabase = await assertAdmin()
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      title,
      subtitle: String(formData.get('subtitle') ?? '').trim() || null,
      brief: String(formData.get('brief') ?? '').trim() || null,
      commission_note: String(formData.get('commission_note') ?? '').trim() || null,
      content_requirements: String(formData.get('content_requirements') ?? '').trim() || null,
      reward_highlight: String(formData.get('reward_highlight') ?? '').trim() || null,
      deadline: deadlineRaw || null,
      status: CAMPAIGN_STATUSES.includes(status) ? status : 'rascunho',
    })
    .select('id, status, title')
    .single()

  if (error || !data) return { ok: false, error: 'Não foi possível criar a campanha.' }

  if (data.status === 'ativa') {
    await notifyActivePartners(supabase, {
      type: 'campaign',
      title: 'Nova campanha disponível',
      body: `A campanha "${data.title}" já está ativa. Confira o briefing.`,
      href: '/dashboard/campanhas',
    })
  }

  revalidatePath('/admin/campanhas')
  revalidatePath('/dashboard/campanhas')
  return { ok: true, error: null }
}

export async function setCampaignStatus(
  _prev: ContentActionState,
  formData: FormData
): Promise<ContentActionState> {
  const id = String(formData.get('campaign_id') ?? '')
  const status = String(formData.get('status') ?? '') as CampaignStatus
  if (!id || !CAMPAIGN_STATUSES.includes(status)) return { ok: false, error: 'Dados inválidos.' }

  const supabase = await assertAdmin()
  const { data, error } = await supabase
    .from('campaigns')
    .update({ status })
    .eq('id', id)
    .select('title, status')
    .single()
  if (error) return { ok: false, error: 'Não foi possível atualizar a campanha.' }

  if (data?.status === 'ativa') {
    await notifyActivePartners(supabase, {
      type: 'campaign',
      title: 'Nova campanha disponível',
      body: `A campanha "${data.title}" já está ativa. Confira o briefing.`,
      href: '/dashboard/campanhas',
    })
  }

  revalidatePath('/admin/campanhas')
  revalidatePath('/dashboard/campanhas')
  return { ok: true, error: null }
}

export async function deleteCampaign(
  _prev: ContentActionState,
  formData: FormData
): Promise<ContentActionState> {
  const id = String(formData.get('campaign_id') ?? '')
  if (!id) return { ok: false, error: 'Campanha inválida.' }
  const supabase = await assertAdmin()
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) return { ok: false, error: 'Não foi possível remover a campanha.' }
  revalidatePath('/admin/campanhas')
  revalidatePath('/dashboard/campanhas')
  return { ok: true, error: null }
}

export async function createAsset(
  _prev: ContentActionState,
  formData: FormData
): Promise<ContentActionState> {
  const title = String(formData.get('title') ?? '').trim()
  const category = String(formData.get('category') ?? '') as AssetCategory
  if (!title) return { ok: false, error: 'Informe um título.' }
  if (!ASSET_CATEGORIES.includes(category)) return { ok: false, error: 'Categoria inválida.' }

  const supabase = await assertAdmin()
  const { error } = await supabase.from('assets').insert({
    category,
    title,
    description: String(formData.get('description') ?? '').trim() || null,
    caption_text: String(formData.get('caption_text') ?? '').trim() || null,
    course: String(formData.get('course') ?? '').trim() || null,
    format: String(formData.get('format') ?? '').trim() || null,
    file_url: String(formData.get('file_url') ?? '').trim() || null,
  })
  if (error) return { ok: false, error: 'Não foi possível criar o material.' }

  revalidatePath('/admin/materiais')
  revalidatePath('/dashboard/materiais')
  return { ok: true, error: null }
}

export async function deleteAsset(
  _prev: ContentActionState,
  formData: FormData
): Promise<ContentActionState> {
  const id = String(formData.get('asset_id') ?? '')
  if (!id) return { ok: false, error: 'Material inválido.' }
  const supabase = await assertAdmin()
  const { error } = await supabase.from('assets').delete().eq('id', id)
  if (error) return { ok: false, error: 'Não foi possível remover o material.' }
  revalidatePath('/admin/materiais')
  revalidatePath('/dashboard/materiais')
  return { ok: true, error: null }
}
