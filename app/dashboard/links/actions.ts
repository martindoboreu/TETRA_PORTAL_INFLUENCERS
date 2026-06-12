'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type LinkActionState = { ok: boolean; error: string | null }

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7)
}

// Reject keyboard-mash labels ("asdasdasd", "aaaa") — every origin in the
// performance table must read like a real channel.
function isJunkLabel(label: string): boolean {
  const compact = label.toLowerCase().replace(/\s+/g, '')
  if (compact.length < 3) return true
  if (/(.)\1{3,}/.test(compact)) return true // 4+ repeats of one char
  if (/^(.{1,4})\1+$/.test(compact)) return true // short pattern repeated (asd-asd-asd)
  return false
}

export async function createLink(
  _prev: LinkActionState,
  formData: FormData
): Promise<LinkActionState> {
  const label = String(formData.get('label') ?? '').trim()
  const customSlug = String(formData.get('slug') ?? '').trim()
  const discountCode = String(formData.get('discount_code') ?? '').trim() || null

  if (!label) return { ok: false, error: 'Dê um nome ao link.' }
  if (isJunkLabel(label)) {
    return {
      ok: false,
      error: 'Use um nome descritivo da origem, ex.: Reel "IA não é Google" ou Bio Instagram.',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sessão expirada.' }

  const base = customSlug ? slugify(customSlug) : slugify(label)
  const slug = base ? `${base}-${randomSuffix()}` : randomSuffix()

  const { error } = await supabase.from('links').insert({
    partner_id: user.id,
    label,
    slug,
    discount_code: discountCode,
  })

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Esse cupom já está em uso. Escolha outro.' }
    }
    return { ok: false, error: 'Não foi possível criar o link. Tente novamente.' }
  }

  revalidatePath('/dashboard/links')
  return { ok: true, error: null }
}

export async function deleteLink(
  _prev: LinkActionState,
  formData: FormData
): Promise<LinkActionState> {
  const linkId = String(formData.get('link_id') ?? '')
  if (!linkId) return { ok: false, error: 'Link inválido.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sessão expirada.' }

  const { error } = await supabase.from('links').delete().eq('id', linkId).eq('partner_id', user.id)
  if (error) return { ok: false, error: 'Não foi possível excluir o link.' }

  revalidatePath('/dashboard/links')
  revalidatePath('/dashboard')
  return { ok: true, error: null }
}

export async function toggleLinkStatus(
  _prev: LinkActionState,
  formData: FormData
): Promise<LinkActionState> {
  const linkId = String(formData.get('link_id') ?? '')
  const nextStatus = String(formData.get('status') ?? '')
  if (!linkId || (nextStatus !== 'active' && nextStatus !== 'paused')) {
    return { ok: false, error: 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('links')
    .update({ status: nextStatus })
    .eq('id', linkId)
    .eq('partner_id', user.id)

  if (error) return { ok: false, error: 'Não foi possível atualizar o link.' }

  revalidatePath('/dashboard/links')
  return { ok: true, error: null }
}
