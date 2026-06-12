import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAuthorizedIngest, maskBuyer, resolveSlug, resolveCoupon } from '@/lib/tracking'

// Lead ingestion. The brand site calls this when a visitor submits a form
// (newsletter, "quero saber mais", etc.) carrying the attribution ref.
//
//   POST /api/track/lead
//   headers: x-tetra-ingest-key: <TETRA_INGEST_KEY>
//   body: { ref?: string, coupon?: string, buyer?: string, external_id?: string }
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isAuthorizedIngest(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let body: { ref?: string; coupon?: string; buyer?: string; external_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const link =
    (body.ref ? await resolveSlug(body.ref) : null) ??
    (body.coupon ? await resolveCoupon(body.coupon) : null)

  // No attribution → acknowledge without recording. The site shouldn't retry.
  if (!link) {
    return NextResponse.json({ ok: true, attributed: false })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('leads')
    .insert({
      partner_id: link.partner_id,
      link_id: link.link_id,
      buyer_masked: maskBuyer(body.buyer),
      external_id: body.external_id ?? null,
    })

  // 23505 = unique violation on external_id → webhook retry, already recorded.
  if (error && error.code !== '23505') {
    return NextResponse.json({ ok: false, error: 'insert_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, attributed: true })
}
