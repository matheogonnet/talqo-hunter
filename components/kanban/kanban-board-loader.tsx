'use client'

import dynamic from 'next/dynamic'
import { KANBAN_COLUMNS } from '@/lib/kanban-columns'
import type { ProspectStatus, ProspectWithDecisionMakers } from '@/lib/types/database'

const KanbanBoard = dynamic(
  () => import('./board').then((mod) => mod.KanbanBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-0 snap-x snap-mandatory gap-3 overflow-x-auto px-3 py-3 scrollbar-thin sm:gap-4 sm:px-6 sm:py-4">
        {KANBAN_COLUMNS.map((col) => (
          <div
            key={col.status}
            className="h-full min-h-[10rem] w-[min(85vw,20rem)] shrink-0 snap-center rounded-xl border border-border bg-muted/30 animate-pulse sm:w-[22rem]"
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
