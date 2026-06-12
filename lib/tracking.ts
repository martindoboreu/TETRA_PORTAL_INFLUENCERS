import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

// Attribution + ingestion helpers, shared by /r/[slug] and /api/track/*.
// Everything here runs server-side with the service-role key (RLS-bypassing),
// so it must never be imported from a client component.

/** Query param the brand site reads to attribute a visit. */
export const REF_PARAM = 'ref'
/** First-party cookie the redirect drops on the portal origin (defensive). */
export const REF_COOKIE = 'tetra_ref'
/** How long an attribution stays valid, in seconds (last-click, 30 days). */
export const ATTRIBUTION_TTL = 60 * 60 * 24 * 30

export interface ResolvedLink {
  link_id: string
  partner_id: string
  status: 'active' | 'paused'
}

/** Resolve a referral slug to its owning link + partner. Null if unknown. */
export async function resolveSlug(slug: string): Promise<ResolvedLink | null> {
  if (!slug) return null
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('links')
    .select('id, partner_id, status')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) return null
  return { link_id: data.id, partner_id: data.partner_id, status: data.status as 'active' | 'paused' }
}

/** Resolve a discount code the same way (checkout may only know the coupon). */
export async function resolveCoupon(code: string): Promise<ResolvedLink | null> {
  if (!code) return null
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('links')
    .select('id, partner_id, status')
    .eq('discount_code', code.toUpperCase())
    .maybeSingle()
  if (error || !data) return null
  return { link_id: data.id, partner_id: data.partner_id, status: data.status as 'active' | 'paused' }
}

/** The partner's authoritative commission rate (fraction, e.g. 0.32). */
export async function partnerCommissionRate(partnerId: string): Promise<number> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('commission_rate')
    .eq('id', partnerId)
    .maybeSingle()
  return Number(data?.commission_rate ?? 0.3)
}

// LGPD: we never persist raw email/phone/CPF. Mask to a non-reversible-ish
// display token at the boundary so the rest of the system only sees masks.
export function maskBuyer(raw: string | null | undefined): string {
  const value = (raw ?? '').trim()
  if (!value) return 'Cliente'
  if (value.includes('@')) {
    const [user, domain] = value.split('@')
    const head = user.slice(0, 1)
    return `${head}${'*'.repeat(Math.max(user.length - 1, 1))}@${domain}`
  }
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 8) return `•••• ${digits.slice(-4)}`
  // Fallback: initials, matching the seed's "L. Pereira" style.
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((p, i) => (i === 0 ? `${p.slice(0, 1).toUpperCase()}.` : p))
    .join(' ')
}

/**
 * Constant-time-ish check of the shared ingest secret. The brand site sends it
 * as `x-tetra-ingest-key`. Without TETRA_INGEST_KEY set, ingestion is closed.
 */
export function isAuthorizedIngest(request: Request): boolean {
  const expected = process.env.TETRA_INGEST_KEY
  if (!expected) return false
  const provided = request.headers.get('x-tetra-ingest-key') ?? ''
  if (provided.length !== expected.length) return false
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i)
  }
  return mismatch === 0
}

/** Brand site base URL (where the redirect sends visitors). */
export function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tetraeducacao.com.br').replace(/\/+$/, '')
}
