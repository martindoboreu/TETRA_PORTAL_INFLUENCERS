import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'

const PUBLIC_PATHS = new Set<string>(['/', '/conta-em-analise'])

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname.startsWith('/api/auth')) return true
  if (pathname.startsWith('/favicon')) return true
  if (pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)) return true
  return false
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )

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
}
