import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  isAuthorizedIngest,
  maskBuyer,
  partnerCommissionRate,
  resolveCoupon,
  resolveSlug,
} from '@/lib/tracking'
import type { ConversionStatus } from '@/lib/database.types'

// Conversion ingestion. The brand site / payment provider calls this when an
// enrollment is paid, and again for follow-up events (refund, settlement).
//
//   POST /api/track/conversion
//   headers: x-tetra-ingest-key: <TETRA_INGEST_KEY>
//   body: {
//     order_id: string,            // idempotency key (external_id)
//     ref?: string, coupon?: string,
//     course: string, amount: number,
//     buyer?: string,
//     status?: 'confirmado' | 'pago' | 'reembolsado'
//   }
//
// Commission is ALWAYS computed here from the partner's current rate — the
// caller never gets to set it.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_STATUS: ConversionStatus[] = ['confirmado', 'pago', 'reembolsado']

export async function POST(request: Request) {
  if (!isAuthorizedIngest(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let body: {
    order_id?: string
    ref?: string
    coupon?: string
    course?: string
    amount?: number
    buyer?: string
    status?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const orderId = (body.order_id ?? '').trim()
  if (!orderId) {
    return NextResponse.json({ ok: false, error: 'order_id_required' }, { status: 400 })
  }

  const status: ConversionStatus = VALID_STATUS.includes(body.status as ConversionStatus)
    ? (body.status as ConversionStatus)
    : 'confirmado'

  const supabase = createAdminClient()

  // Follow-up event (refund / settlement): if we already recorded this order,
  // just transition its status. Never recompute commission or duplicate revenue.
  const { data: existing } = await supabase
    .from('conversions')
    .select('id')
    .eq('external_id', orderId)
    .maybeSingle()

  if (existing) {
    if (status !== 'confirmado') {
      await supabase.from('conversions').update({ status }).eq('id', existing.id)
    }
    return NextResponse.json({ ok: true, deduped: true })
  }

  // New conversion → must be attributable and well-formed.
  const amount = Number(body.amount)
  if (!body.course || !Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const link =
    (body.ref ? await resolveSlug(body.ref) : null) ??
    (body.coupon ? await resolveCoupon(body.coupon) : null)
  if (!link) {
    return NextResponse.json({ ok: true, attributed: false })
  }

  const rate = await partnerCommissionRate(link.partner_id)
  const commission = Math.round(amount * rate * 100) / 100

  const { error } = await supabase.from('conversions').insert({
    partner_id: link.partner_id,
    link_id: link.link_id,
    buyer_masked: maskBuyer(body.buyer),
    course: body.course,
    amount,
    commission,
    status,
    external_id: orderId,
  })

  // Lost the race with a concurrent retry — already recorded, treat as success.
  if (error && error.code !== '23505') {
    return NextResponse.json({ ok: false, error: 'insert_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, attributed: true, commission })
}
