'use client'

import dynamic from 'next/dynamic'
import { KANBAN_COLUMNS } from '@/lib/kanban-columns'
import type { ProspectStatus, ProspectWithDecisionMakers } from '@/lib/types/database'

const KanbanBoard = dynamic(
  () => import('./board').then((mod) => mod.KanbanBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex gap-3 h-full overflow-x-auto px-6 py-4 scrollbar-thin">
        {KANBAN_COLUMNS.map((col) => (
          <div
            key={col.status}
            className="flex-shrink-0 w-64 h-[min(24rem,70vh)] rounded-xl border border-border bg-muted/30 animate-pulse"
            aria-hidden
          />
        ))}
      </div>
    ),
  }
)

type KanbanBoardLoaderProps = {
  grouped: Record<ProspectStatus, ProspectWithDecisionMakers[]>
}

/**
 * Enveloppe client : `ssr: false` sur le Kanban évite les erreurs d’hydratation
 * (@dnd-kit / aria-describedby) et n’est pas autorisé depuis un Server Component.
 */
export function KanbanBoardLoader({ grouped }: KanbanBoardLoaderProps) {
  return <KanbanBoard columns={KANBAN_COLUMNS} grouped={grouped} />
}
