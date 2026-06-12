import 'server-only'
import type { IntegrationProvider } from '@/lib/database.types'

// ---------------------------------------------------------------------------
// Connector adapter layer.
//
// Each provider has an adapter that knows how to (a) build the OAuth consent URL
// and (b) exchange a callback code for an account snapshot (handle + followers).
//
// Real OAuth requires a registered app per provider. We detect that by checking
// for the provider's client-id/secret env vars (see hasOAuth). When credentials
// are absent, the connect route falls back to the manual-entry flow.
// ---------------------------------------------------------------------------

export type AccountSnapshot = {
  externalHandle: string
  externalAccountId: string
  followerCount: number
  accessToken: string | null
  scope: string | null
}

const CLIENT_ID_ENV: Record<IntegrationProvider, string> = {
  meta: 'META_CLIENT_ID',
  instagram: 'META_CLIENT_ID', // Instagram is accessed via the Meta app
  google: 'GOOGLE_CLIENT_ID',
  youtube: 'GOOGLE_CLIENT_ID',
  tiktok: 'TIKTOK_CLIENT_KEY',
}

const CLIENT_SECRET_ENV: Record<IntegrationProvider, string> = {
  meta: 'META_CLIENT_SECRET',
  instagram: 'META_CLIENT_SECRET',
  google: 'GOOGLE_CLIENT_SECRET',
  youtube: 'GOOGLE_CLIENT_SECRET',
  tiktok: 'TIKTOK_CLIENT_SECRET',
}

const GRAPH = 'https://graph.facebook.com/v19.0'

// Real OAuth is available for a provider only when its app credentials are present.
export function hasOAuth(provider: IntegrationProvider): boolean {
  return Boolean(process.env[CLIENT_ID_ENV[provider]] && process.env[CLIENT_SECRET_ENV[provider]])
}

// Where the provider should redirect after consent.
export function callbackUrl(provider: IntegrationProvider, origin: string): string {
  return `${origin}/api/integrations/${provider}/callback`
}

// Build the OAuth consent URL the creator is redirected to.
export function authorizeUrl(provider: IntegrationProvider, origin: string, state: string): string {
  const redirect = encodeURIComponent(callbackUrl(provider, origin))
  const clientId = process.env[CLIENT_ID_ENV[provider]] ?? ''
  switch (provider) {
    case 'instagram': {
      // Instagram followers are read through the connected IG Business account on a Page.
      const scope = 'instagram_basic,pages_show_list,pages_read_engagement,business_management'
      return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirect}&state=${state}&response_type=code&scope=${scope}`
    }
    case 'meta': {
      const scope = 'pages_show_list,pages_read_engagement'
      return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirect}&state=${state}&response_type=code&scope=${scope}`
    }
    case 'google':
    case 'youtube':
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirect}&state=${state}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/youtube.readonly')}`
    case 'tiktok':
      return `https://www.tiktok.com/v2/auth/authorize?client_key=${clientId}&redirect_uri=${redirect}&state=${state}&response_type=code&scope=user.info.stats`
    default:
      return `${origin}/dashboard/configuracoes#redes-sociais`
  }
}

async function fetchJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url)
  const json = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    const err = json?.error as { message?: string } | undefined
    throw new Error(err?.message ?? `Request failed (${res.status})`)
  }
  return json
}

// Exchange a Meta OAuth code for a token, then read the real follower count.
async function exchangeMeta(
  provider: 'meta' | 'instagram',
  code: string,
  origin: string
): Promise<AccountSnapshot> {
  const clientId = process.env[CLIENT_ID_ENV[provider]] ?? ''
  const clientSecret = process.env[CLIENT_SECRET_ENV[provider]] ?? ''
  const redirect = callbackUrl(provider, origin)

  // 1) code -> short-lived user token
  const tokenRes = await fetchJson(
    `${GRAPH}/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&client_secret=${clientSecret}&code=${encodeURIComponent(code)}`
  )
  const shortToken = String(tokenRes.access_token ?? '')

  // 2) exchange for a long-lived token (best effort)
  let token = shortToken
  try {
    const longRes = await fetchJson(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortToken}`
    )
    if (longRes.access_token) token = String(longRes.access_token)
  } catch {
    /* keep short-lived token */
  }

  // 3) list the user's Pages
  const pagesRes = await fetchJson(`${GRAPH}/me/accounts?fields=id,name,fan_count,followers_count&access_token=${token}`)
  const pages = (pagesRes.data as Array<Record<string, unknown>>) ?? []

  if (provider === 'meta') {
    const page = pages[0]
    if (!page) {
      return { externalHandle: '@facebook', externalAccountId: 'meta', followerCount: 0, accessToken: token, scope: 'pages_read_engagement' }
    }
    const followers = Number(page.followers_count ?? page.fan_count ?? 0)
    return {
      externalHandle: '@' + String(page.name ?? 'facebook').replace(/\s+/g, '').toLowerCase(),
      externalAccountId: String(page.id ?? 'meta'),
      followerCount: Number.isFinite(followers) ? followers : 0,
      accessToken: token,
      scope: 'pages_read_engagement',
    }
  }

  // instagram: find a Page with a connected IG business account
  for (const page of pages) {
    const pageId = String(page.id ?? '')
    if (!pageId) continue
    try {
      const ig = await fetchJson(`${GRAPH}/${pageId}?fields=instagram_business_account&access_token=${token}`)
      const iga = ig.instagram_business_account as { id?: string } | undefined
      if (iga?.id) {
        const acct = await fetchJson(`${GRAPH}/${iga.id}?fields=username,followers_count&access_token=${token}`)
        return {
          externalHandle: '@' + String(acct.username ?? 'instagram'),
          externalAccountId: String(iga.id),
          followerCount: Number(acct.followers_count ?? 0),
          accessToken: token,
          scope: 'instagram_basic',
        }
      }
    } catch {
      /* try next page */
    }
  }

  throw new Error('Nenhuma conta Instagram Profissional conectada a uma Página do Facebook foi encontrada.')
}

// Exchange an OAuth callback code for a real account snapshot.
export async function exchangeCode(
  provider: IntegrationProvider,
  code: string,
  origin: string
): Promise<AccountSnapshot> {
  if (provider === 'meta' || provider === 'instagram') {
    return exchangeMeta(provider, code, origin)
  }
  throw new Error('OAuth ainda não implementado para esta plataforma.')
}
