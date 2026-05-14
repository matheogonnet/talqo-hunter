'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createManualProspect } from '@/lib/actions/prospects'
import type { RoleCategory } from '@/lib/types/database'
import { ALL_SECTORS } from '@/lib/sectors'
import { toast } from 'sonner'
import { Building2, Loader2, Plus, User } from 'lucide-react'

const CONTACT_ROLE_OPTIONS: { value: RoleCategory; label: string }[] = [
  { value: 'ceo', label: 'CEO' },
  { value: 'founder', label: 'Fondateur / cofondateur' },
  { value: 'cto', label: 'CTO / Tech' },
  { value: 'cos', label: 'Chief of Staff' },
  { value: 'head_of_people', label: 'RH / People' },
  { value: 'other', label: 'Autre' },
]

function emptyForm() {
  return {
    companyName: '',
    website: '',
    linkedinUrl: '',
    sector: '',
    description: '',
    openPositions: '',
    headcount: '',
    contactName: '',
    contactRole: '',
    contactLinkedin: '',
    contactHeadline: '',
    contactRoleCategory: 'other' as RoleCategory,
  }
}

export function AddProspectDialog({ triggerLabel = 'Nouvelle entreprise' }: { triggerLabel?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [f, setF] = useState(emptyForm)

  function resetForm() {
    setF(emptyForm())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!f.companyName.trim()) {
      toast.error('Indique le nom de l’entreprise')
      return
    }
    if (!f.sector.trim()) {
      toast.error('Choisis un secteur')
      return
    }
    if (!f.website.trim() && !f.linkedinUrl.trim()) {
      toast.error('Site web ou page LinkedIn entreprise requis')
      return
    }
    if (!f.contactName.trim() || !f.contactRole.trim()) {
      toast.error('Contact principal : nom et rôle obligatoires')
      return
    }

    const openPositions =
      f.openPositions.trim() === '' ? null : parseInt(f.openPositions, 10)
    const headcount = f.headcount.trim() === '' ? null : parseInt(f.headcount, 10)

    setLoading(true)
    const result = await createManualProspect({
      company_name: f.companyName.trim(),
      website: f.website.trim() || null,
      linkedin_url: f.linkedinUrl.trim() || null,
      sector: f.sector.trim(),
      description: f.description.trim() || null,
      open_positions_count:
        openPositions != null && !Number.isNaN(openPositions) ? openPositions : null,
      employee_count_estimate:
        headcount != null && !Number.isNaN(headcount) ? headcount : null,
      contact_full_name: f.contactName.trim(),
      contact_role: f.contactRole.trim(),
      contact_linkedin_url: f.contactLinkedin.trim() || null,
      contact_linkedin_headline: f.contactHeadline.trim() || null,
      contact_role_category: f.contactRoleCategory,
    })
    setLoading(false)
    if (!result.success) {
      toast.error('Création impossible', { description: result.error })
      return
    }
    toast.success('Entreprise et contact enregistrés')
    setOpen(false)
    resetForm()
    router.refresh()
    if (result.id) {
      router.push(`/prospects/${result.id}`)
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="gap-1.5 shrink-0"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-3.5 h-3.5" />
        {triggerLabel}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[min(90vh,720px)] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Nouvelle entreprise prospect
              </DialogTitle>
              <DialogDescription>
                Renseigne l’entreprise (secteur + au moins un lien web ou LinkedIn) et{' '}
                <strong className="text-foreground">un contact principal obligatoire</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-3">
              <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Entreprise
                </p>
                <div className="space-y-1.5">
                  <label htmlFor="ap-name" className="text-xs font-medium text-muted-foreground">
                    Nom légal / commercial *
                  </label>
                  <Input
                    id="ap-name"
                    value={f.companyName}
                    onChange={(e) => setF((s) => ({ ...s, companyName: e.target.value }))}
                    placeholder="Ex. Acme SAS"
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ap-sector" className="text-xs font-medium text-muted-foreground">
                    Secteur *
                  </label>
                  <select
                    id="ap-sector"
                    value={f.sector}
                    onChange={(e) => setF((s) => ({ ...s, sector: e.target.value }))}
                    required
                    className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm"
                  >
                    <option value="">— Choisir —</option>
                    {ALL_SECTORS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ap-web" className="text-xs font-medium text-muted-foreground">
                    Site web (https://…)
                  </label>
                  <Input
                    id="ap-web"
                    value={f.website}
                    onChange={(e) => setF((s) => ({ ...s, website: e.target.value }))}
                    placeholder="https://…"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ap-li" className="text-xs font-medium text-muted-foreground">
                    Page LinkedIn entreprise
                  </label>
                  <Input
                    id="ap-li"
                    value={f.linkedinUrl}
                    onChange={(e) => setF((s) => ({ ...s, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/company/…"
                    className="bg-background"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Au moins un des deux champs (site ou LinkedIn entreprise) est requis.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="ap-posts" className="text-xs font-medium text-muted-foreground">
                      Postes ouverts (optionnel)
                    </label>
                    <Input
                      id="ap-posts"
                      inputMode="numeric"
                      value={f.openPositions}
                      onChange={(e) => setF((s) => ({ ...s, openPositions: e.target.value }))}
                      placeholder="0"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="ap-hc" className="text-xs font-medium text-muted-foreground">
                      Effectif estimé (optionnel)
                    </label>
                    <Input
                      id="ap-hc"
                      inputMode="numeric"
                      value={f.headcount}
                      onChange={(e) => setF((s) => ({ ...s, headcount: e.target.value }))}
                      placeholder="ex. 45"
                      className="bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ap-desc" className="text-xs font-medium text-muted-foreground">
                    Contexte / pitch (optionnel)
                  </label>
                  <Textarea
                    id="ap-desc"
                    value={f.description}
                    onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))}
                    placeholder="Ce que fait la boîte, pourquoi elle est P1…"
                    rows={3}
                    className="bg-background text-sm resize-y min-h-[72px]"
                  />
                </div>
              </section>

              <section className="space-y-3 rounded-lg border border-primary/25 bg-primary/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Contact principal (obligatoire)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="ap-cn" className="text-xs font-medium text-muted-foreground">
                      Nom complet *
                    </label>
                    <Input
                      id="ap-cn"
                      value={f.contactName}
                      onChange={(e) => setF((s) => ({ ...s, contactName: e.target.value }))}
                      placeholder="Jane Doe"
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="ap-cr" className="text-xs font-medium text-muted-foreground">
                      Rôle / titre *
                    </label>
                    <Input
                      id="ap-cr"
                      value={f.contactRole}
                      onChange={(e) => setF((s) => ({ ...s, contactRole: e.target.value }))}
                      placeholder="Head of Talent"
                      required
                      className="bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ap-cat" className="text-xs font-medium text-muted-foreground">
                    Catégorie
                  </label>
                  <select
                    id="ap-cat"
                    value={f.contactRoleCategory}
                    onChange={(e) =>
                      setF((s) => ({ ...s, contactRoleCategory: e.target.value as RoleCategory }))
                    }
                    className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm"
                  >
                    {CONTACT_ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ap-cli" className="text-xs font-medium text-muted-foreground">
                    Profil LinkedIn (URL, optionnel)
                  </label>
                  <Input
                    id="ap-cli"
                    value={f.contactLinkedin}
                    onChange={(e) => setF((s) => ({ ...s, contactLinkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/…"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ap-ch" className="text-xs font-medium text-muted-foreground">
                    Accroche LinkedIn (optionnel)
                  </label>
                  <Input
                    id="ap-ch"
                    value={f.contactHeadline}
                    onChange={(e) => setF((s) => ({ ...s, contactHeadline: e.target.value }))}
                    placeholder="Headline affichée sur LinkedIn"
                    className="bg-background"
                  />
                </div>
              </section>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Création…
                  </>
                ) : (
                  'Créer entreprise + contact'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
