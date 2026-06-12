import 'server-only'
import { NextResponse } from 'next/server'
import { recordConversion } from '@/lib/ingest'
import {
  classifyStatus,
  extractConversion,
  tokenMatches,
  webhookToken,
} from '@/lib/webhooks'

interface HandlerOpts {
  /** Label for logs, e.g. 'guru'. */
  provider: string
  /** Env var holding the expected webhook token, e.g. 'GURU_WEBHOOK_TOKEN'. */
  tokenEnv: string
}

// Shared adapter for hosted-checkout webhooks. Verifies the provider token,
// extracts the conversion fields defensively, maps the status, and routes paid
// / refunded events into the same recordConversion() core. Acknowledges (200)
// for irrelevant events so the provider doesn't retry forever.
export async function handleCheckoutWebhook(request: Request, opts: HandlerOpts) {
  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  if (process.env.WEBHOOK_DEBUG === '1') {
    console.log(`[webhook:${opts.provider}] raw`, JSON.stringify(payload).slice(0, 4000))
  }

  const expected = process.env[opts.tokenEnv]
  if (!expected || !tokenMatches(webhookToken(request, payload), expected)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const x = extractConversion(payload)
  const status = classifyStatus(x.statusRaw)

  // Not a paid or refunded event (waiting, abandoned, etc.) → acknowledge, no-op.
  if (!status) {
    console.log(`[webhook:${opts.provider}] ignored status="${x.statusRaw}" order=${x.orderId}`)
    return NextResponse.json({ ok: true, ignored: true, status: x.statusRaw ?? null })
  }

  if (!x.orderId) {
    return NextResponse.json({ ok: false, error: 'missing_order_id' }, { status: 400 })
  }

  const result = await recordConversion({
    orderId: x.orderId,
    status,
    amount: x.amount,
    course: x.course,
    buyer: x.buyer,
    ref: x.ref,
    coupon: x.coupon,
  })

  console.log(
    `[webhook:${opts.provider}] order=${x.orderId} status=${status} ` +
      `coupon=${x.coupon ?? '-'} ref=${x.ref ?? '-'} → ${JSON.stringify(result)}`
  )

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status })
  }
  return NextResponse.json(result)
}
