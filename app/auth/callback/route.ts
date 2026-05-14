import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Échange le `code` PKCE du magic link contre une session (cookies httpOnly).
 * Sans cette route, le lien email ouvre l'app mais l'utilisateur reste anonyme.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const nextRaw = url.searchParams.get('next') ?? '/'
  const next = safeInternalPath(nextRaw)

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('missing_code')}`, request.url)
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession:', error.message)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('exchange_failed')}`, request.url)
    )
  }

  return NextResponse.redirect(new URL(next, request.url))
}

function safeInternalPath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return '/'
  return path
}
