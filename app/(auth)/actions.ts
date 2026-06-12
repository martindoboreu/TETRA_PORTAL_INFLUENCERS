'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type SignInState = { error: string | null }

export async function signIn(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Informe e-mail e senha.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { error: 'E-mail ou senha inválidos.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, onboarding_completed')
    .eq('id', data.user.id)
    .maybeSingle()

  const role = profile?.role ?? 'partner'
  const status = profile?.status ?? 'pendente'

  if (role === 'admin') redirect('/admin')
  if (status !== 'ativo') redirect('/conta-em-analise')
  if (!profile?.onboarding_completed) redirect('/onboarding')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export type ProfileSaveState = { ok: boolean; error: string | null }

export async function savePartnerProfile(
  _prev: ProfileSaveState,
  formData: FormData
): Promise<ProfileSaveState> {
  const fullName = String(formData.get('full_name') ?? '').trim()
  const handle = String(formData.get('handle') ?? '').trim().replace(/^@/, '')
  const pixKey = String(formData.get('pix_key') ?? '').trim() || null

  if (!fullName) {
    return { ok: false, error: 'Informe seu nome completo.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sessão expirada. Faça login novamente.' }

  // Partners can only update safe fields on their own row (RLS profiles_update_self_safe).
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, handle: handle || null, pix_key: pixKey })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Esse nome de usuário já está em uso.' }
    return { ok: false, error: 'Não foi possível salvar. Tente novamente.' }
  }

  revalidatePath('/dashboard/configuracoes')
  revalidatePath('/dashboard')
  return { ok: true, error: null }
}
