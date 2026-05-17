import { createClient } from '@/lib/supabase/server'
import { KanbanBoardLoader } from '@/components/kanban/kanban-board-loader'
import { AddProspectDialog } from '@/components/prospects/add-prospect-dialog'
import { KANBAN_COLUMNS } from '@/lib/kanban-columns'
import type { ProspectStatus, ProspectWithDecisionMakers } from '@/lib/types/database'

export const metadata = { title: 'Pipeline — Talqo Hunter' }

export default async function DashboardPage() {
  const supabase = await createClient()

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
    .not('status', 'in', '("archived")')
    .order('p1_score', { ascending: false })

  if (error) {
    console.error('[Dashboard] Erreur fetch prospects:', error)
  }

  const prospects = (data ?? []) as ProspectWithDecisionMakers[]

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Pipeline de prospection</h1>
            <p className="text-sm text-muted-foreground">
              <span className="md:hidden">
                {prospects.length} prospects actifs — fais défiler les colonnes puis maintiens la poignée pour déplacer une carte.
              </span>
              <span className="hidden md:inline">
                {prospects.length} prospects actifs — glisse les cartes pour changer d&apos;étape.
              </span>
            </p>
          </div>
          <AddProspectDialog />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <KanbanBoardLoader grouped={grouped} />
      </div>
    </div>
  )
}
