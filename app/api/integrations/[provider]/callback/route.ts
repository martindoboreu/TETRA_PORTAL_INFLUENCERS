import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidProvider } from '@/lib/integrations/providers'
import { exchangeCode } from '@/lib/integrations/adapters'

export const dynamic = 'force-dynamic'

// Real-OAuth callback. Providers redirect here with ?code & ?state (=partner id).
// In sandbox mode the connect route handles everything and never reaches here.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const origin = req.nextUrl.origin

  const stateParam = req.nextUrl.searchParams.get('state') ?? ''
  const [, returnTo = 'configuracoes'] = stateParam.split('|')
  const back = (qs: string) =>
    NextResponse.redirect(
      returnTo === 'onboarding'
        ? `${origin}/onboarding?${qs}`
        : `${origin}/dashboard/configuracoes?${qs}#redes-sociais`
    )

  if (!isValidProvider(provider)) return back('error=provider')

  const code = req.nextUrl.searchParams.get('code')
  if (!code) return back('error=denied')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/`)

  const stateUserId = stateParam.split('|')[0]
  if (stateUserId && stateUserId !== user.id) {
    return NextResponse.redirect(`${origin}/`)
  }

  try {
    const snap = await exchangeCode(provider, code, origin)
    const { error } = await supabase.from('integrations').upsert(
      {
        partner_id: user.id,
        provider,
        status: 'connected',
        external_handle: snap.externalHandle,
        external_account_id: snap.externalAccountId,
        follower_count: snap.followerCount,
        access_token: snap.accessToken,
        scope: snap.scope,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'partner_id,provider' }
    )
    if (error) return back('error=save')
    return back(`connected=${provider}`)
  } catch {
    return back('error=exchange')
  }
}
