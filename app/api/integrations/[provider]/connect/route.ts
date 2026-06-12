import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidProvider } from '@/lib/integrations/providers'
import { authorizeUrl, hasOAuth } from '@/lib/integrations/adapters'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const origin = req.nextUrl.origin
  const returnTo =
    req.nextUrl.searchParams.get('return') === 'onboarding' ? 'onboarding' : 'configuracoes'
  const back = (qs: string) =>
    NextResponse.redirect(
      returnTo === 'onboarding'
        ? `${origin}/onboarding?${qs}`
        : `${origin}/dashboard/configuracoes?${qs}#redes-sociais`
    )

  if (!isValidProvider(provider)) return back('error=provider')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/`)

  if (!hasOAuth(provider)) return back('error=config')

  // state = userId|returnTo so the callback knows where to send them back.
  const state = `${user.id}|${returnTo}`
  return NextResponse.redirect(authorizeUrl(provider, origin, state))
}
