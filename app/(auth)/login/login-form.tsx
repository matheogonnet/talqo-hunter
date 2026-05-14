'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Mail } from 'lucide-react'

/**
 * Formulaire de connexion par magic link (Supabase Auth)
 * Envoie un email avec un lien de connexion — sans mot de passe
 */
export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Doit correspondre à une URL autorisée dans Supabase + route /auth/callback
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (error) {
      toast.error('Erreur lors de l\'envoi', { description: error.message })
      return
    }

    setSent(true)
    toast.success('Magic link envoyé !', {
      description: `Vérifie ta boîte mail : ${email}`,
    })
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
        <div className="mx-auto w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <p className="font-medium">Vérifie ta boîte mail</p>
        <p className="text-sm text-muted-foreground">
          Un lien de connexion a été envoyé à <strong>{email}</strong>
        </p>
        <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
          Utiliser un autre email
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="matheo@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="bg-card border-border"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Envoyer le magic link
          </>
        )}
      </Button>
    </form>
  )
}
