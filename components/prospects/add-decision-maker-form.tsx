'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createDecisionMaker } from '@/lib/actions/decision-makers'
import type { RoleCategory } from '@/lib/types/database'
import { toast } from 'sonner'
import { Loader2, UserPlus } from 'lucide-react'

const ROLE_OPTIONS: { value: RoleCategory; label: string }[] = [
  { value: 'ceo', label: 'CEO' },
  { value: 'founder', label: 'Fondateur / cofondateur' },
  { value: 'cto', label: 'CTO / Tech' },
  { value: 'cos', label: 'Chief of Staff' },
  { value: 'head_of_people', label: 'RH / People' },
  { value: 'other', label: 'Autre' },
]

export function AddDecisionMakerForm({ prospectId }: { prospectId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [roleCategory, setRoleCategory] = useState<RoleCategory>('other')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !role.trim()) {
      toast.error('Nom et rôle sont requis')
      return
    }
    setLoading(true)
    const result = await createDecisionMaker(prospectId, {
      full_name: fullName.trim(),
      role: role.trim(),
      linkedin_url: linkedinUrl.trim() || null,
      role_category: roleCategory,
    })
    setLoading(false)
    if (!result.success) {
      toast.error('Ajout impossible', { description: result.error })
      return
    }
    toast.success('Contact ajouté')
    setFullName('')
    setRole('')
    setLinkedinUrl('')
    setRoleCategory('other')
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <UserPlus className="w-3.5 h-3.5" />
        Ajouter un contact
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3"
    >
      <p className="text-sm font-medium text-foreground">Nouveau décideur pour cette entreprise</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nom complet *</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            className="bg-background h-9 text-sm"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Rôle / titre *</label>
          <Input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Head of Talent"
            className="bg-background h-9 text-sm"
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Profil LinkedIn (URL, optionnel)</label>
        <Input
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://linkedin.com/in/…"
          className="bg-background h-9 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Catégorie</label>
        <select
          value={roleCategory}
          onChange={(e) => setRoleCategory(e.target.value as RoleCategory)}
          className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Enregistrer le contact
        </Button>
      </div>
    </form>
  )
}
