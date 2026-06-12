import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'

const PUBLIC_PATHS = new Set<string>(['/', '/conta-em-analise', '/aplicar'])

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname.startsWith('/api/auth')) return true
  // Attribution pipeline: the referral redirect and the ingestion endpoints are
  // hit by anonymous visitors / the brand site, never by a logged-in partner.
  if (pathname.startsWith('/r/')) return true
  if (pathname.startsWith('/api/track/')) return true
  if (pathname.startsWith('/api/ref/')) return true
  if (pathname.startsWith('/favicon')) return true
  if (pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)) return true
  return false
}

export async function updateSession(request: NextRequest) {
  // Fast path: the attribution routes are anonymous and don't need a session
  // refresh. Skip the Supabase round-trip so the referral redirect stays snappy.
  const { pathname: earlyPath } = request.nextUrl
  if (
    earlyPath.startsWith('/r/') ||
    earlyPath.startsWith('/api/track/') ||
    earlyPath.startsWith('/api/ref/')
  ) {
    return NextResponse.next({ request })
  }

  // Misconfiguration guard: without the Supabase env the client can't be built.
  // Fail OPEN (let the request through) rather than throwing a site-wide 500
  // (MIDDLEWARE_INVOCATION_FAILED). Authenticated routes stay protected by the
  // page-level requireUser()/requireAdmin() guards. NEXT_PUBLIC_* are inlined at
  // build time — if this branch fires in production, the env was missing at build.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[middleware] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — skipping auth routing.')
    return NextResponse.next({ request })
  }

  try {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // IMPORTANT: per @supabase/ssr docs, do NOT run logic between getUser() and the
    // returned response — it will desynchronize the session cookie.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

  // 1) Unauthenticated → push to /
  if (!user) {
    if (isPublic(pathname)) return supabaseResponse
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // 2) Authenticated → resolve role + status, then guard
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role ?? 'partner'
  const status = profile?.status ?? 'pendente'
  const isAdmin = role === 'admin'

  let onboardingDone = true
  if (!isAdmin && status === 'ativo') {
    const { data: ob, error: obError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()
    // If migration 0008 is not applied yet, do not block routing.
    onboardingDone = obError ? true : (ob?.onboarding_completed ?? false)
  }

  // Admins always use the admin portal — never partner pending/onboarding flows.
  if (isAdmin) {
    if (
      pathname === '/conta-em-analise' ||
      pathname === '/onboarding' ||
      pathname.startsWith('/dashboard')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Logged-in users shouldn't see the login page.
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    if (status !== 'ativo') {
      url.pathname = '/conta-em-analise'
    } else if (!onboardingDone) {
      url.pathname = '/onboarding'
    } else {
      url.pathname = '/dashboard'
    }
    return NextResponse.redirect(url)
  }

  // Partners with status 'pendente' or 'inativo' → /conta-em-analise
  if (role === 'partner' && status !== 'ativo' && pathname !== '/conta-em-analise') {
    const url = request.nextUrl.clone()
    url.pathname = '/conta-em-analise'
    return NextResponse.redirect(url)
  }

  // Active partners shouldn't sit on /conta-em-analise
  if (role === 'partner' && status === 'ativo' && pathname === '/conta-em-analise') {
    const url = request.nextUrl.clone()
    url.pathname = onboardingDone ? '/dashboard' : '/onboarding'
    return NextResponse.redirect(url)
  }

  // Partners blocked from /admin/*
  if (pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // One-time onboarding at signup: only block until onboarding_completed is set
  // (happens when they connect their first social). Returning users are never blocked.
  if (role === 'partner' && status === 'ativo') {
    if (!onboardingDone && pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      url.search = ''
      return NextResponse.redirect(url)
    }
    if (onboardingDone && pathname === '/onboarding') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

    return supabaseResponse
  } catch (err) {
    // Any failure in the auth/session round-trip (bad env, network, Supabase
    // outage) must not 500 the whole site. Fail open — pages guard themselves.
    console.error('[middleware] auth routing failed, passing request through:', err)
    return NextResponse.next({ request })
  }
}
