import 'server-only'
import type { ConversionStatus } from '@/lib/database.types'

// Defensive parsing for hosted-checkout webhooks (Guru, Onprofit). Their exact
// payload shapes vary and aren't fully documented, so we probe many common
// field paths (EN + PT-BR) instead of assuming one schema. Turn on WEBHOOK_DEBUG=1
// to log the full raw body to Vercel logs and refine these paths against real data.

type Json = Record<string, unknown>

/** Read the first defined, non-empty value across dotted paths (supports array indices). */
function pick(obj: Json, paths: string[]): unknown {
  for (const path of paths) {
    let cur: unknown = obj
    for (const seg of path.split('.')) {
      if (cur == null) break
      cur = (cur as Json)[seg]
    }
    if (cur !== undefined && cur !== null && cur !== '') return cur
  }
  return undefined
}

function asString(v: unknown): string | undefined {
  if (v == null) return undefined
  const s = String(v).trim()
  return s ? s : undefined
}

function asNumber(v: unknown): number | undefined {
  if (v == null || v === '') return undefined
  // Accept "1.234,56" (pt-BR), "1234.56", or numbers.
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  let s = String(v).replace(/[^\d.,-]/g, '')
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.')
  else if (s.includes(',')) s = s.replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

export interface ExtractedConversion {
  orderId?: string
  statusRaw?: string
  amount?: number
  course?: string
  buyer?: string
  coupon?: string
  ref?: string
}

export function extractConversion(payload: Json): ExtractedConversion {
  return {
    orderId: asString(
      pick(payload, [
        'order_id', 'id', 'transaction.id', 'transaction_id', 'order.id', 'code',
        'sale.id', 'sale_id', 'subscription.id', 'data.id', 'data.order_id',
      ])
    ),
    statusRaw: asString(
      pick(payload, [
        'status', 'transaction.status', 'payment.status', 'sale.status',
        'order.status', 'situacao', 'data.status', 'webhook_type',
      ])
    ),
    amount: asNumber(
      pick(payload, [
        'amount', 'payment.total', 'transaction.total', 'total', 'value',
        'payment.value', 'sale.total', 'order.total', 'valor', 'payment.amount',
        'items.0.total_value', 'data.amount', 'data.total',
      ])
    ),
    course: asString(
      pick(payload, [
        'course', 'product.name', 'items.0.name', 'product_name', 'product.title',
        'plan.name', 'offer.name', 'name', 'produto.nome', 'data.product.name',
      ])
    ),
    buyer: asString(
      pick(payload, [
        'buyer', 'contact.email', 'customer.email', 'buyer.email', 'client.email',
        'cliente.email', 'email', 'subscriber.email', 'data.customer.email',
      ])
    ),
    coupon: asString(
      pick(payload, [
        'coupon', 'coupon_code', 'coupon.code', 'discount.coupon', 'payment.coupon',
        'cupom', 'tracking.coupon', 'items.0.coupon', 'sale.coupon', 'data.coupon',
      ])
    ),
    ref: asString(
      pick(payload, [
        'ref', 'tracking.src', 'trackings.src', 'src', 'tracking.utm_source',
        'utm_source', 'tracking.tracking_code', 'tracking.source', 'data.tracking.src',
      ])
    ),
  }
}

// Map a provider status (EN or PT-BR) to our model, or null to ignore the event
// (e.g. waiting_payment, abandoned — not a sale and not a refund).
export function classifyStatus(raw: string | undefined): ConversionStatus | null {
  const s = (raw ?? '').toLowerCase()
  if (/(approv|aprovad|paid|pago|complet|conclu|active|ativ|authorized|autorizad)/.test(s)) {
    return 'confirmado'
  }
  if (/(refund|reembols|chargeback|charged_back|estorn|dispute)/.test(s)) {
    return 'reembolsado'
  }
  return null
}

// Constant-time-ish token comparison for webhook auth.
export function tokenMatches(provided: string | null | undefined, expected: string): boolean {
  const a = provided ?? ''
  if (a.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= a.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

/** Token from ?token=, x-webhook-token header, or a token field in the body. */
export function webhookToken(request: Request, payload: Json): string | null {
  const url = new URL(request.url)
  return (
    url.searchParams.get('token') ||
    request.headers.get('x-webhook-token') ||
    asString(pick(payload, ['token', 'api_token', 'account_token', 'webhook_token'])) ||
    null
  )
}
