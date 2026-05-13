import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/kanban/board'
import type { ProspectStatus, ProspectWithDecisionMakers } from '@/lib/types/database'

export const metadata = { title: 'Pipeline — Talqo Hunter' }

// Colonnes Kanban dans l'ordre du pipeline
export const KANBAN_COLUMNS: { status: ProspectStatus; label: string }[] = [
  { status: 'new', label: 'Nouveau' },
  { status: 'connection_sent', label: 'Connexion envoyée' },
  { status: 'connected', label: 'Connecté' },
  { status: 'm1_sent', label: 'M1 envoyé' },
  { status: 'replied', label: 'Répondu' },
  { status: 'm2_sent', label: 'M2 envoyé' },
  { status: 'm3_sent', label: 'M3 envoyé' },
  { status: 'beta_signed', label: 'Beta signé 🎉' },
]

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch tous les prospects non archivés avec leurs décideurs
  const { data, error } = await supabase
    .from('prospects')
    .select(`
      *,
      decision_makers (
        id,
        full_name,
        role,
        role_category,
        profile_picture_url,
        connection_status,
        priority
      )
    `)
    .not('status', 'in', '("rejected","archived")')
    .order('p1_score', { ascending: false })

  if (error) {
    console.error('[Dashboard] Erreur fetch prospects:', error)
  }

  const prospects = (data ?? []) as ProspectWithDecisionMakers[]

  // Grouper par status
  const grouped = KANBAN_COLUMNS.reduce<
    Record<ProspectStatus, ProspectWithDecisionMakers[]>
  >(
    (acc, col) => {
      acc[col.status] = []
      return acc
    },
    {} as Record<ProspectStatus, ProspectWithDecisionMakers[]>
  )

  for (const p of prospects) {
    if (grouped[p.status]) {
      grouped[p.status].push(p)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Pipeline de prospection</h1>
          <p className="text-sm text-muted-foreground">
            {prospects.length} prospects actifs
          </p>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard columns={KANBAN_COLUMNS} grouped={grouped} />
      </div>
    </div>
  )
}
