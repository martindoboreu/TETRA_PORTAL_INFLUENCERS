'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

export type ApplyState = { ok: boolean; error: string | null }

// Public affiliate application. Creates a pending partner account that lands in
// the admin approval queue (/admin/aprovacoes). Anyone can apply; admins qualify.
export async function applyAsAffiliate(
  _prev: ApplyState,
  formData: FormData
): Promise<ApplyState> {
  const fullName = String(formData.get('full_name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const handle = String(formData.get('handle') ?? '').trim().replace(/^@/, '')
  const primarySocial = String(formData.get('primary_social') ?? '').trim()
  const followers = parseInt(String(formData.get('follower_count') ?? '').replace(/\D/g, ''), 10)
  const pitch = String(formData.get('pitch') ?? '').trim()

  if (!fullName || !email || !password) {
    return { ok: false, error: 'Preencha nome, e-mail e senha.' }
  }
  if (password.length < 8) {
    return { ok: false, error: 'A senha precisa ter ao menos 8 caracteres.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (error) {
    if (/registered|already|exist/i.test(error.message)) {
      return { ok: false, error: 'Este e-mail já tem cadastro. Tente fazer login.' }
    }
    return { ok: false, error: 'Não foi possível enviar sua inscrição. Tente novamente.' }
  }

  const userId = data.user?.id
  if (userId) {
    // The handle_new_user trigger already created a pendente partner profile.
    // Enrich it with the applicant's details. Use the service role so it works
    // regardless of email-confirmation state.
    const admin = createAdminClient()
    const followerCount = Number.isFinite(followers) ? followers : 0

    const { error: coreErr } = await admin
      .from('profiles')
      .update({ full_name: fullName, handle: handle || null, follower_count: followerCount })
      .eq('id', userId)
    // Handle collision (unique) → save without the handle rather than failing.
    if (coreErr?.code === '23505') {
      await admin
        .from('profiles')
        .update({ full_name: fullName, follower_count: followerCount })
        .eq('id', userId)
    }

    // Qualification fields — best-effort (no-op if migration 0016 not applied yet).
    await admin
      .from('profiles')
      .update({ primary_social: primarySocial || null, application_pitch: pitch || null })
      .eq('id', userId)
      .then(
        () => {},
        () => {}
      )
  }

  return { ok: true, error: null }
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
