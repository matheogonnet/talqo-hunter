import { createClient } from '@/lib/supabase/server'
import { AddContactDialog } from '@/components/network/add-contact-dialog'
import { ContactCard } from '@/components/network/contact-card'
import { NetworkFilters } from '@/components/network/network-filters'
import { matchesNetworkContact } from '@/lib/search'
import type { NetworkContact } from '@/lib/types/database'

export const metadata = { title: 'Réseau — Talqo Hunter' }

interface PageProps {
  searchParams: Promise<{ lever?: string; q?: string }>
}

export default async function ReseauPage({ searchParams }: PageProps) {
  const { lever, q } = await searchParams
  const supabase = await createClient()

  // Fetch all contacts
  const { data, error } = await supabase
    .from('network_contacts')
    .select('*')
    .order('relevance_score', { ascending: false })
    .order('full_name')

  if (error) {
    return (
      <div className="flex-1 p-6">
        <p className="text-sm text-destructive">
          Erreur de chargement — la table <code>network_contacts</code> existe-t-elle ?{' '}
          <a
            href="https://supabase.com/dashboard/project/pqacwpwrquxdbzlzvufv/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Exécute le SQL de migration
          </a>
        </p>
      </div>
    )
  }

  const contacts = (data ?? []) as NetworkContact[]

  // Counts par lever_type
  const counts: Record<string, number> = {}
  for (const c of contacts) {
    counts[c.lever_type] = (counts[c.lever_type] ?? 0) + 1
  }

  let filtered = contacts
  if (lever && lever !== 'all') {
    filtered = filtered.filter((c) => c.lever_type === lever)
  }
  if (q?.trim()) {
    filtered = filtered.filter((c) => matchesNetworkContact(c, q.trim()))
  }

  // Sépare contactés / à contacter
  const toContact = filtered.filter((c) => !c.is_contacted)
  const contacted = filtered.filter((c) => c.is_contacted)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Réseau LinkedIn</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length === contacts.length
                ? `${contacts.length} contact${contacts.length > 1 ? 's' : ''} qualifiés comme leviers Talqo`
                : `${filtered.length} sur ${contacts.length} contact${contacts.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <AddContactDialog />
        </div>

        {/* Filtres */}
        <NetworkFilters counts={counts} />

        {/* Grille à contacter */}
        {toContact.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              À contacter — {toContact.length}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {toContact.map((c) => (
                <ContactCard key={c.id} contact={c} />
              ))}
            </div>
          </section>
        )}

        {/* Grille contactés */}
        {contacted.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Déjà contactés — {contacted.length}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contacted.map((c) => (
                <ContactCard key={c.id} contact={c} />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground">
            {q?.trim() ? 'Aucun contact ne correspond à votre recherche.' : 'Aucun contact dans cette catégorie.'}
          </div>
        )}

      </div>
    </div>
  )
}
