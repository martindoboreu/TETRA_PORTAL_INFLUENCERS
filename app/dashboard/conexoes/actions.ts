'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isValidProvider } from '@/lib/integrations/providers'

export type ConexaoState = { ok: boolean; error: string | null }

export async function connectIntegration(
  _prev: ConexaoState,
  formData: FormData
): Promise<ConexaoState> {
  const provider = String(formData.get('provider') ?? '')
  const handleRaw = String(formData.get('handle') ?? '').trim()
  const followers = Number(formData.get('follower_count'))

  if (!isValidProvider(provider)) return { ok: false, error: 'Plataforma inválida.' }
  if (!handleRaw) return { ok: false, error: 'Informe seu @ ou URL do perfil.' }
  if (!Number.isFinite(followers) || followers < 0) {
    return { ok: false, error: 'Informe um número de seguidores válido.' }
  }

  const handle = handleRaw.startsWith('@') ? handleRaw : `@${handleRaw.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '')}`

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sessão expirada.' }

  const { error } = await supabase.from('integrations').upsert(
    {
      partner_id: user.id,
      provider,
      status: 'connected',
      external_handle: handle,
      follower_count: Math.round(followers),
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: 'partner_id,provider' }
  )
  if (error) return { ok: false, error: 'Não foi possível conectar. Tente novamente.' }

  revalidatePath('/dashboard/configuracoes')
  revalidatePath('/onboarding')
  revalidatePath('/dashboard')
  return { ok: true, error: null }
}

export async function disconnectIntegration(
  _prev: ConexaoState,
  formData: FormData
): Promise<ConexaoState> {
  const provider = String(formData.get('provider') ?? '')
  if (!isValidProvider(provider)) return { ok: false, error: 'Plataforma inválida.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('partner_id', user.id)
    .eq('provider', provider)
  if (error) return { ok: false, error: 'Não foi possível desconectar.' }

  revalidatePath('/dashboard/configuracoes')
  revalidatePath('/onboarding')
  revalidatePath('/dashboard')
  return { ok: true, error: null }
}
