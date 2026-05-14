import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_DISABLED } from '@/lib/auth-mode'

/**
 * Proxy (anciennement middleware) qui :
 * 1. Rafraîchit la session Supabase à chaque requête
 * 2. Redirige vers /login si non authentifié sur les routes dashboard
 * 3. Laisse passer les routes publiques (login, api/cron, api/* avec secret)
 *
 * Renamed from middleware.ts → proxy.ts for Next.js 16 compatibility
 */
export async function proxy(request: NextRequest) {
  if (AUTH_DISABLED) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Routes publiques : toujours accessibles
  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth/callback') || // magic link → échange PKCE avant session
    pathname.startsWith('/api/cron/') || // protégé par CRON_SECRET, pas par auth
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
