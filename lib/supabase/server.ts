import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Client Supabase côté serveur (Server Components, Server Actions, Route Handlers)
 *
 * Note : On n'utilise pas le générique <Database> car les types sont générés
 * par Supabase CLI. Les résultats de queries sont castés manuellement.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll peut échouer dans les Server Components en lecture seule
            // Safe à ignorer si le middleware gère le refresh des sessions
          }
        },
      },
    }
  )
}

/**
 * Client Supabase avec la service role key (pour les cron jobs, contourne RLS)
 * NE JAMAIS exposer côté client
 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  )
}
