import { NextResponse } from 'next/server'
import { isAuthorizedIngest } from '@/lib/tracking'
import { recordLead } from '@/lib/ingest'

// Lead ingestion — the brand site calls this when a visitor submits a form
// (newsletter, "quero saber mais") carrying the attribution ref or coupon.
//
//   POST /api/track/lead
//   headers: x-tetra-ingest-key: <TETRA_INGEST_KEY>
//   body: { ref?, coupon?, buyer?, external_id? }
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isAuthorizedIngest(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const result = await recordLead({
    ref: body.ref as string | undefined,
    coupon: body.coupon as string | undefined,
    buyer: body.buyer as string | undefined,
    externalId: body.external_id as string | undefined,
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status })
  }
  return NextResponse.json(result)
}
