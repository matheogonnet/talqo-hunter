import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './login-form'
import { AUTH_DISABLED } from '@/lib/auth-mode'
import { TalqoMark } from '@/components/brand/talqo-mark'

export const metadata = { title: 'Connexion — Talqo Hunter' }

type LoginPageProps = {
  searchParams: Promise<{ error?: string; code?: string; next?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (AUTH_DISABLED) {
    redirect('/')
  }

  const params = await searchParams

  // Supabase envoie parfois le PKCE sur /login (Site URL + path) au lieu de /auth/callback
  if (params.code) {
    const qs = new URLSearchParams({ code: params.code })
    if (params.next) qs.set('next', params.next)
    redirect(`/auth/callback?${qs.toString()}`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const authCallbackError = params.error

  // Déjà connecté → dashboard
  if (user) redirect('/')

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / titre */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card p-1">
            <TalqoMark size={40} className="h-10 w-10 rounded-md border-0" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Talqo Hunter</h1>
          <p className="text-muted-foreground text-sm">
            Prospection automatisée · Usage perso
          </p>
        </div>

        {authCallbackError ? (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            Le lien de connexion a expiré ou est invalide. Demande un nouveau magic link.
          </p>
        ) : null}

        <LoginForm />
      </div>
    </main>
  )
}
