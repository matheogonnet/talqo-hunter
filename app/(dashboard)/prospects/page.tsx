import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { AddProspectDialog } from '@/components/prospects/add-prospect-dialog'
import { Building2, Users } from 'lucide-react'
import { scoreColor } from '@/lib/utils/score'
import type { Prospect } from '@/lib/types/database'

export const metadata = { title: 'Prospects — Talqo Hunter' }

export default async function ProspectsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('prospects')
    .select('id, company_name, sector, p1_score, status, open_positions_count, target_plan, website, detected_ats, discovered_at')
    .order('p1_score', { ascending: false })
    .limit(200)

  const prospects = (data ?? []) as Pick<
    Prospect,
    'id' | 'company_name' | 'sector' | 'p1_score' | 'status' | 'open_positions_count' | 'target_plan' | 'website' | 'detected_ats' | 'discovered_at'
  >[]

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Tous les prospects</h1>
            <p className="text-sm text-muted-foreground">
              {prospects.length} fiches — ouvre une entreprise pour le détail ou ajoute une ligne.
            </p>
          </div>
          <AddProspectDialog triggerLabel="Ajouter une entreprise" />
        </div>
      </div>

      {/* Table — scrollable horizontalement sur mobile */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entreprise</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Secteur</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Score P1</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Postes</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ATS</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan cible</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {prospects.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/prospects/${p.id}`}
                      className="flex items-center gap-2 font-medium hover:text-primary transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate max-w-[160px]">{p.company_name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize whitespace-nowrap">
                    {p.sector?.replace('_', ' ') ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {p.p1_score != null ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${scoreColor(p.p1_score)}`}>
                        {p.p1_score}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.open_positions_count != null ? (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {p.open_positions_count}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {p.detected_ats ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {p.target_plan ? (
                      <Badge variant="outline" className="text-xs">
                        {p.target_plan}
                      </Badge>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {prospects.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Aucun prospect pour l&apos;instant</p>
            <p className="text-xs mt-1">Lance un run depuis les Paramètres</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: 'bg-slate-100 text-slate-600',
    connection_sent: 'bg-blue-100 text-blue-700',
    connected: 'bg-blue-100 text-blue-800',
    m1_sent: 'bg-violet-100 text-violet-700',
    replied: 'bg-amber-100 text-amber-700',
    m2_sent: 'bg-orange-100 text-orange-700',
    m3_sent: 'bg-rose-100 text-rose-700',
    beta_signed: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    archived: 'bg-slate-100 text-slate-400',
  }
  const labels: Record<string, string> = {
    new: 'Nouveau',
    connection_sent: 'Connexion env.',
    connected: 'Connecté',
    m1_sent: 'M1 envoyé',
    replied: 'Répondu',
    m2_sent: 'M2 envoyé',
    m3_sent: 'M3 envoyé',
    beta_signed: 'Beta signé',
    rejected: 'Refusé',
    archived: 'Archivé',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${styles[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}
