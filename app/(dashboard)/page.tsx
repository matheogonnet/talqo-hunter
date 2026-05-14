import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/kanban/board'
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
    .not('status', 'in', '("rejected","archived")')
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
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Pipeline de prospection</h1>
          <p className="text-sm text-muted-foreground">
            {prospects.length} prospects actifs
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard columns={KANBAN_COLUMNS} grouped={grouped} />
      </div>
    </div>
  )
}
