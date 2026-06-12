import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Public attribution resolver. The brand site calls this when a visitor arrives
// via /r/{slug} (or has the tetra_ref cookie) to personalize the experience:
//   - which coupon to auto-apply at checkout (the partner's discount_code)
//   - who referred them ("Indicado por @handle"), to credit the influencer
//
// Read-only and non-sensitive (coupon codes and public handles), so it's CORS-open.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, max-age=300',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('links')
    .select('discount_code, status, profiles(full_name, handle, avatar_initials)')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data || data.status !== 'active') {
    return NextResponse.json({ valid: false }, { status: 200, headers: CORS })
  }

  // profiles embed comes back as an object (or array depending on PostgREST); normalize.
  const p = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles

  return NextResponse.json(
    {
      valid: true,
      slug,
      coupon: data.discount_code ?? null,
      partner: {
        name: p?.full_name ?? null,
        handle: p?.handle ?? null,
        initials: p?.avatar_initials ?? null,
      },
    },
    { status: 200, headers: CORS }
  )
}
