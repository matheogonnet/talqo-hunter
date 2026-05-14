import { AUTH_DISABLED } from '@/lib/auth-mode'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * Client Supabase pour les Server Actions qui modifient les données.
 * Avec AUTH_DISABLED, il n’y a pas de session utilisateur : la clé anon est souvent bloquée par la RLS.
 * On utilise alors la service role (uniquement côté serveur, jamais exposée au navigateur).
 */
export async function createMutationClient() {
  if (AUTH_DISABLED) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!key) {
      console.error(
        '[createMutationClient] SUPABASE_SERVICE_ROLE_KEY manquante : les UPDATE peuvent échouer (RLS).'
      )
      return createClient()
    }
    return createServiceClient()
  }
  return createClient()
}
