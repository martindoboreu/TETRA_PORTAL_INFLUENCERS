// Central source of truth for partner-facing link/coupon URLs.
// Override via env when the production short-link domain is provisioned.

const RAW_BASE =
  process.env.NEXT_PUBLIC_REFERRAL_BASE_URL?.replace(/\/+$/, '') ??
  'https://tetraeducacao.com.br/r'

/** Full shareable referral URL for a link slug, e.g. https://tetraeducacao.com.br/r/abc123 */
export function referralUrl(slug: string): string {
  return `${RAW_BASE}/${slug}`
}

/** Display form without protocol, for compact UI chips. */
export function referralDisplay(slug: string): string {
  return referralUrl(slug).replace(/^https?:\/\//, '')
}
