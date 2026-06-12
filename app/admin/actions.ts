'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { ProfileStatus, SocietyTierKey, Database } from '@/lib/database.types'
import { isSocietyTierKey, tierConfig } from '@/lib/society'

type ProgramSettingsUpdate = Database['public']['Tables']['program_settings']['Update']

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

const VALID_STATUS: ProfileStatus[] = ['ativo', 'pendente', 'inativo']

export type AdminActionState = { ok: boolean; error: string | null }

export async function setPartnerStatus(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const id = String(formData.get('partner_id') ?? '')
  const status = String(formData.get('status') ?? '') as ProfileStatus
  if (!id || !VALID_STATUS.includes(status)) {
    return { ok: false, error: 'Dados inválidos.' }
  }
  const supabase = await assertAdmin()
  const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
  if (error) return { ok: false, error: 'Não foi possível atualizar o status.' }

  // Welcome the partner the moment their account is approved.
  if (status === 'ativo') {
    await supabase.from('notifications').insert({
      partner_id: id,
      type: 'approval',
      title: 'Cadastro aprovado',
      body: 'Bem-vindo(a) ao programa de parceiros Tetra! Sua conta já está ativa.',
      href: '/dashboard',
    })
  }

  revalidatePath('/admin/parceiros')
  revalidatePath(`/admin/parceiros/${id}`)
  revalidatePath('/admin/aprovacoes')
  revalidatePath('/admin')
  return { ok: true, error: null }
}

// Follower count is now informational only — commission follows the Society tier,
// not the audience size. We keep it editable so admins can record reach.
export async function updatePartnerFollowers(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const id = String(formData.get('partner_id') ?? '')
  const followers = Number(formData.get('follower_count'))
  if (!id) return { ok: false, error: 'Parceiro inválido.' }
  if (!Number.isFinite(followers) || followers < 0) {
    return { ok: false, error: 'Número de seguidores inválido.' }
  }
  const supabase = await assertAdmin()
  const { error } = await supabase
    .from('profiles')
    .update({ follower_count: Math.round(followers) })
    .eq('id', id)
  if (error) return { ok: false, error: 'Não foi possível salvar as alterações.' }
  revalidatePath('/admin/parceiros')
  revalidatePath(`/admin/parceiros/${id}`)
  return { ok: true, error: null }
}

// Extend (or adjust) a partner's Tetra Society status. Setting society_tier fires
// the apply_society_tier trigger, which updates the partner's tier name + rate.
export async function inviteToTier(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const id = String(formData.get('partner_id') ?? '')
  const tier = String(formData.get('society_tier') ?? '')
  if (!id || !isSocietyTierKey(tier)) return { ok: false, error: 'Dados inválidos.' }
  const supabase = await assertAdmin()
  const { error } = await supabase
    .from('profiles')
    .update({ society_tier: tier as SocietyTierKey })
    .eq('id', id)
  if (error) return { ok: false, error: 'Não foi possível atualizar o status.' }

  const config = tierConfig(tier)
  await supabase.from('notifications').insert({
    partner_id: id,
    type: 'milestone',
    title: `Convite para o ${config.name}`,
    body: `Você foi convidado para o ${config.name}. Seu novo status já está ativo na Tetra Society.`,
    href: '/dashboard/society',
  })

  revalidatePath('/admin/parceiros')
  revalidatePath(`/admin/parceiros/${id}`)
  revalidatePath('/admin/society')
  revalidatePath('/admin')
  return { ok: true, error: null }
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

// Admin-scored qualitative criteria used when weighing an invitation.
export async function updatePartnerEvaluation(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const id = String(formData.get('partner_id') ?? '')
  if (!id) return { ok: false, error: 'Parceiro inválido.' }
  const approved = Number(formData.get('approved_content_count'))
  if (!Number.isFinite(approved) || approved < 0) {
    return { ok: false, error: 'Conteúdos aprovados inválido.' }
  }
  const supabase = await assertAdmin()
  const { error } = await supabase.from('partner_evaluations').upsert(
    {
      partner_id: id,
      approved_content_count: Math.round(approved),
      compliance_score: clampScore(Number(formData.get('compliance_score'))),
      content_quality_score: clampScore(Number(formData.get('content_quality_score'))),
      responsiveness_score: clampScore(Number(formData.get('responsiveness_score'))),
      notes: String(formData.get('notes') ?? '').trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'partner_id' }
  )
  if (error) return { ok: false, error: 'Não foi possível salvar a avaliação.' }
  revalidatePath(`/admin/parceiros/${id}`)
  revalidatePath('/admin/society')
  return { ok: true, error: null }
}

// Per-tier commission configuration. Editing a rate re-applies it to every
// partner currently in that tier.
export async function updateSocietyTierRate(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const id = Number(formData.get('tier_id'))
  const ratePct = Number(formData.get('commission_rate_pct'))
  if (!Number.isInteger(id)) return { ok: false, error: 'Status inválido.' }
  if (!Number.isFinite(ratePct) || ratePct < 0 || ratePct > 100) {
    return { ok: false, error: 'Taxa deve estar entre 0 e 100.' }
  }
  const supabase = await assertAdmin()
  const { error } = await supabase
    .from('society_tiers')
    .update({ commission_rate: ratePct / 100 })
    .eq('id', id)
  if (error) return { ok: false, error: 'Não foi possível salvar o status.' }
  const admin = createAdminClient()
  await admin.rpc('reapply_society_rates')
  revalidatePath('/admin/configuracoes')
  revalidatePath('/admin/parceiros')
  revalidatePath('/admin/society')
  return { ok: true, error: null }
}

export async function markPartnerPaid(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const id = String(formData.get('partner_id') ?? '')
  const reference = String(formData.get('reference_period') ?? '').trim() || null
  if (!id) return { ok: false, error: 'Parceiro inválido.' }
  const supabase = await assertAdmin()
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('admin_mark_partner_paid', {
    p_partner: id,
    p_reference_period: reference,
  })
  if (error) return { ok: false, error: 'Não foi possível registrar o repasse.' }

  const paid = data?.[0]
  if (paid) {
    const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      Number(paid.amount ?? 0)
    )
    await supabase.from('notifications').insert({
      partner_id: id,
      type: 'payout',
      title: 'Repasse realizado',
      body: `Seu repasse de ${amount} foi processado via PIX.`,
      href: '/dashboard/comissoes',
    })
  }

  revalidatePath('/admin/repasses')
  revalidatePath(`/admin/parceiros/${id}`)
  revalidatePath('/admin')
  revalidatePath('/dashboard/comissoes')
  return { ok: true, error: null }
}

export async function saveProgramSettings(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const ratePct = Number(formData.get('default_commission_rate_pct'))
  const nextPayout = String(formData.get('next_payout_date') ?? '').trim() || null
  if (!Number.isFinite(ratePct) || ratePct < 0 || ratePct > 100) {
    return { ok: false, error: 'Taxa padrão deve estar entre 0 e 100.' }
  }
  const update: ProgramSettingsUpdate = {
    default_commission_rate: ratePct / 100,
    next_payout_date: nextPayout,
    updated_at: new Date().toISOString(),
  }
  const supabase = await assertAdmin()
  const { error } = await supabase.from('program_settings').update(update).eq('id', 1)
  if (error) return { ok: false, error: 'Não foi possível salvar as configurações.' }
  revalidatePath('/admin/configuracoes')
  revalidatePath('/admin')
  return { ok: true, error: null }
}
