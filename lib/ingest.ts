import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  maskBuyer,
  partnerCommissionRate,
  resolveCoupon,
  resolveSlug,
} from '@/lib/tracking'
import type { ConversionStatus } from '@/lib/database.types'

// Core ingestion logic, shared by the generic /api/track/* endpoints and the
// provider webhook adapters (Guru, Onprofit). Attribution resolves by ref slug
// first, then by coupon code — the signal hosted checkouts reliably carry.
//
// Commission is ALWAYS computed here from the partner's current rate; callers
// never set it.

export interface ConversionInput {
  orderId: string
  status?: string
  amount?: number
  course?: string
  buyer?: string | null
  ref?: string | null
  coupon?: string | null
}

export type IngestResult =
  | { ok: true; attributed: boolean; deduped?: boolean; commission?: number }
  | { ok: false; error: string; status: number }

const VALID_STATUS: ConversionStatus[] = ['confirmado', 'pago', 'reembolsado']

export function normalizeStatus(raw: string | null | undefined): ConversionStatus {
  return VALID_STATUS.includes(raw as ConversionStatus) ? (raw as ConversionStatus) : 'confirmado'
}

async function resolveAttribution(ref?: string | null, coupon?: string | null) {
  return (
    (ref ? await resolveSlug(ref) : null) ?? (coupon ? await resolveCoupon(coupon) : null)
  )
}

export async function recordConversion(input: ConversionInput): Promise<IngestResult> {
  const orderId = (input.orderId ?? '').trim()
  if (!orderId) return { ok: false, error: 'order_id_required', status: 400 }

  const status = normalizeStatus(input.status)
  const supabase = createAdminClient()

  // Follow-up event (refund / settlement): transition the existing row by its
  // idempotency key. Never recompute commission or duplicate revenue.
  const { data: existing } = await supabase
    .from('conversions')
    .select('id')
    .eq('external_id', orderId)
    .maybeSingle()

  if (existing) {
    if (status !== 'confirmado') {
      await supabase.from('conversions').update({ status }).eq('id', existing.id)
    }
    return { ok: true, attributed: true, deduped: true }
  }

  const amount = Number(input.amount)
  if (!input.course || !Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: 'invalid_payload', status: 400 }
  }

  const link = await resolveAttribution(input.ref, input.coupon)
  if (!link) return { ok: true, attributed: false }

  const rate = await partnerCommissionRate(link.partner_id)
  const commission = Math.round(amount * rate * 100) / 100

  const { error } = await supabase.from('conversions').insert({
    partner_id: link.partner_id,
    link_id: link.link_id,
    buyer_masked: maskBuyer(input.buyer),
    course: input.course,
    amount,
    commission,
    status,
    external_id: orderId,
  })

  // 23505 = lost a race with a concurrent retry; already recorded.
  if (error && error.code !== '23505') {
    return { ok: false, error: 'insert_failed', status: 500 }
  }

  return { ok: true, attributed: true, commission }
}

export interface LeadInput {
  ref?: string | null
  coupon?: string | null
  buyer?: string | null
  externalId?: string | null
}

export async function recordLead(input: LeadInput): Promise<IngestResult> {
  const link = await resolveAttribution(input.ref, input.coupon)
  if (!link) return { ok: true, attributed: false }

  const supabase = createAdminClient()
  const { error } = await supabase.from('leads').insert({
    partner_id: link.partner_id,
    link_id: link.link_id,
    buyer_masked: maskBuyer(input.buyer),
    external_id: input.externalId ?? null,
  })

  if (error && error.code !== '23505') {
    return { ok: false, error: 'insert_failed', status: 500 }
  }
  return { ok: true, attributed: true }
}
