import { createBrowserClient } from '@supabase/ssr'

/**
 * Client Supabase côté navigateur (Client Components uniquement)
 *
 * Note : Les types DB seront auto-générés avec `npx supabase gen types`
 * après avoir configuré le projet Supabase.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
