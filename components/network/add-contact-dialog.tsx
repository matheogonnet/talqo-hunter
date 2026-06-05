'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createNetworkContact } from '@/lib/actions/network'
import { LEVER_TYPES } from '@/lib/lever-types'
import type { LeverType } from '@/lib/types/database'
import { toast } from 'sonner'
import { Loader2, Plus, Users } from 'lucide-react'

function emptyForm() {
  return {
    full_name: '',
    company: '',
    headline: '',
    linkedin_url: '',
    connected_at: '',
    lever_type: 'founder' as LeverType,
    relevance_score: 7,
    notes: '',
  }
}

export function AddContactDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [f, setF] = useState(emptyForm)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!f.full_name.trim()) {
      toast.error('Indique le nom')
      return
    }
    setLoading(true)
    const result = await createNetworkContact({
      full_name: f.full_name.trim(),
      company: f.company.trim() || null,
      headline: f.headline.trim() || null,
      linkedin_url: f.linkedin_url.trim() || null,
      connected_at: f.connected_at || null,
      lever_type: f.lever_type,
      relevance_score: f.relevance_score,
      notes: f.notes.trim() || null,
    })
    setLoading(false)
    if (!result.success) {
      toast.error('Erreur', { description: result.error })
      return
    }
    toast.success('Contact ajouté')
    setOpen(false)
    setF(emptyForm())
    router.refresh()
  }

  return (
    <>
      <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setOpen(true)}>
        <Plus className="w-3.5 h-3.5" />
        Ajouter
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setF(emptyForm()) }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Nouveau contact réseau
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nom complet *</label>
                <Input
                  value={f.full_name}
                  onChange={(e) => setF((s) => ({ ...s, full_name: e.target.value }))}
                  placeholder="Jane Dupont"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Entreprise</label>
                  <Input
                    value={f.company}
                    onChange={(e) => setF((s) => ({ ...s, company: e.target.value }))}
                    placeholder="Acme SAS"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Connexion le</label>
                  <Input
                    type="date"
                    value={f.connected_at}
                    onChange={(e) => setF((s) => ({ ...s, connected_at: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Titre LinkedIn (headline)</label>
                <Input
                  value={f.headline}
                  onChange={(e) => setF((s) => ({ ...s, headline: e.target.value }))}
                  placeholder="CEO @ Acme | Hiring 🚀"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">URL LinkedIn</label>
                <Input
                  value={f.linkedin_url}
                  onChange={(e) => setF((s) => ({ ...s, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/in/…"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Type de levier</label>
                  <select
                    value={f.lever_type}
                    onChange={(e) => setF((s) => ({ ...s, lever_type: e.target.value as LeverType }))}
                    className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm"
                  >
                    {LEVER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.emoji} {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Pertinence : {f.relevance_score}/10
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={f.relevance_score}
                    onChange={(e) => setF((s) => ({ ...s, relevance_score: Number(e.target.value) }))}
                    className="w-full mt-2.5"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Notes (optionnel)</label>
                <Textarea
                  value={f.notes}
                  onChange={(e) => setF((s) => ({ ...s, notes: e.target.value }))}
                  placeholder="Contexte, comment l'aborder, lien avec Talqo…"
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Ajout…</> : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
