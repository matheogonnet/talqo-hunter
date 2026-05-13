import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './login-form'

export const metadata = { title: 'Connexion — Talqo Hunter' }

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Déjà connecté → dashboard
  if (user) redirect('/')

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / titre */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Talqo Hunter</h1>
          <p className="text-muted-foreground text-sm">
            Prospection automatisée · Usage perso
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  )
}
