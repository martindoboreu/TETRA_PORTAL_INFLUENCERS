import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ATTRIBUTION_TTL,
  REF_COOKIE,
  REF_PARAM,
  resolveSlug,
  siteBaseUrl,
} from '@/lib/tracking'

// Public referral redirect. A partner shares /r/{slug}; we record the click and
// 302 the visitor to the brand site, carrying ?ref={slug} so the site can set
// its own first-party cookie and echo it back on lead/purchase events.
//
// Runs on the Node runtime (service-role key) and is never cached.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// UTM params are passed straight through so the brand site keeps its analytics.
const PASSTHROUGH = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

export async function GET(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const link = await resolveSlug(slug)

  const dest = new URL(siteBaseUrl())

  // Unknown or paused link → send to the site home with no attribution.
  if (!link || link.status !== 'active') {
    return NextResponse.redirect(dest, { status: 302 })
  }

  // Record the click. Fire-and-forget semantics: a logging failure must never
  // block the redirect the visitor is waiting on.
  try {
    const supabase = createAdminClient()
    await supabase.from('clicks').insert({ link_id: link.link_id, partner_id: link.partner_id })
  } catch {
    // swallow — attribution can also be recovered from the coupon at checkout
  }

  dest.searchParams.set(REF_PARAM, slug)
  for (const key of PASSTHROUGH) {
    const v = request.nextUrl.searchParams.get(key)
    if (v) dest.searchParams.set(key, v)
  }

  const response = NextResponse.redirect(dest, { status: 302 })
  // Defensive same-origin cookie (helps if a future checkout shares this domain).
  response.cookies.set(REF_COOKIE, slug, {
    maxAge: ATTRIBUTION_TTL,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
  })
  return response
}
