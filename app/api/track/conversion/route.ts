import { NextResponse } from 'next/server'
import { isAuthorizedIngest } from '@/lib/tracking'
import { recordConversion } from '@/lib/ingest'

// Generic conversion ingestion (first-party callers using the shared secret).
// Provider webhooks (Guru, Onprofit) have their own adapter routes that reuse
// the same recordConversion() core.
//
//   POST /api/track/conversion
//   headers: x-tetra-ingest-key: <TETRA_INGEST_KEY>
//   body: { order_id, ref?, coupon?, course, amount, buyer?, status? }
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

  const result = await recordConversion({
    orderId: String(body.order_id ?? ''),
    ref: body.ref as string | undefined,
    coupon: body.coupon as string | undefined,
    course: body.course as string | undefined,
    amount: body.amount as number | undefined,
    buyer: body.buyer as string | undefined,
    status: body.status as string | undefined,
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status })
  }
  return NextResponse.json(result)
}
