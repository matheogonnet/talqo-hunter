'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLeverType } from '@/lib/lever-types'
import { toggleContacted, deleteNetworkContact } from '@/lib/actions/network'
import type { NetworkContact } from '@/lib/types/database'
import { toast } from 'sonner'

export function ContactCard({ contact }: { contact: NetworkContact }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const lever = getLeverType(contact.lever_type)

  async function handleToggle() {
    setBusy(true)
    const r = await toggleContacted(contact.id, contact.is_contacted)
    setBusy(false)
    if (!r.success) toast.error('Erreur')
    else router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`Supprimer ${contact.full_name} ?`)) return
    setBusy(true)
    const r = await deleteNetworkContact(contact.id)
    setBusy(false)
    if (!r.success) toast.error('Erreur')
    else { toast.success('Supprimé'); router.refresh() }
  }

  return (
    <div className={`relative rounded-xl border bg-card p-4 flex flex-col gap-3 transition-opacity ${contact.is_contacted ? 'opacity-60' : ''}`}>
      {/* Score — coin supérieur droit */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <span className="text-[11px] font-bold text-muted-foreground">{contact.relevance_score}/10</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 pr-10">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-semibold text-primary">
          {contact.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{contact.full_name}</p>
          {contact.company && (
            <p className="text-xs text-muted-foreground truncate">{contact.company}</p>
          )}
        </div>
      </div>

      {/* Headline */}
      {contact.headline && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {contact.headline}
        </p>
      )}

      {/* Badge + actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${lever.bg} ${lever.color}`}>
          {lever.emoji} {lever.label}
        </span>

        <div className="flex items-center gap-1.5">
          {contact.linkedin_url && (
            <a
              href={contact.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Voir profil LinkedIn"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <Button
            size="sm"
            variant={contact.is_contacted ? 'secondary' : 'outline'}
            className="h-7 text-xs gap-1 px-2"
            onClick={handleToggle}
            disabled={busy}
          >
            {contact.is_contacted ? (
              <><Check className="w-3 h-3 text-emerald-600" /> Contacté</>
            ) : (
              'Contacter'
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={busy}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Notes */}
      {contact.notes && (
        <p className="text-xs text-muted-foreground border-t border-border pt-2 italic">
          {contact.notes}
        </p>
      )}
    </div>
  )
}
