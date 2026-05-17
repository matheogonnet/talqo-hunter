'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './card'
import { LinkedInMark } from '@/components/icons/linkedin-mark'
import type { ProspectStatus, ProspectWithDecisionMakers } from '@/lib/types/database'

interface KanbanColumnProps {
  status: ProspectStatus
  label: string
  prospects: ProspectWithDecisionMakers[]
}

export function KanbanColumn({ status, label, prospects }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  })

  const isRejected = status === 'rejected'

  return (
    <div className="flex h-full min-h-0 w-[min(85vw,20rem)] max-w-full shrink-0 snap-center snap-always flex-col gap-2 sm:w-[22rem] sm:max-w-none">
      {/* Header colonne */}
      <div className="flex items-center justify-between gap-1 px-1">
        <span
          className={`inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${
            isRejected ? 'text-red-400' : 'text-muted-foreground'
          }`}
        >
          {(status === 'connection_sent' || status === 'connected') && (
            <span title="Étapes côté LinkedIn" className="inline-flex shrink-0">
              <LinkedInMark className="h-3.5 w-3.5" />
            </span>
          )}
          <span className="truncate">{label}</span>
        </span>
        {prospects.length > 0 && (
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs ${
              isRejected ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-muted-foreground'
            }`}
          >
            {prospects.length}
          </span>
        )}
      </div>

      {/* Zone de drop — scroll vertical indépendant du scroll horizontal du board */}
      <div
        ref={setNodeRef}
        className={`flex min-h-[10rem] flex-1 touch-pan-y flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain rounded-xl border-2 border-dashed p-2 transition-colors sm:min-h-0 ${
          isOver
            ? isRejected
              ? 'border-red-400 bg-red-50'
              : 'border-primary bg-blue-50'
            : isRejected
              ? 'border-red-200 bg-red-50/30'
              : 'border-slate-200 bg-slate-50/50'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <SortableContext items={prospects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex w-full min-w-0 max-w-full flex-col gap-2">
            {prospects.map((prospect) => (
              <KanbanCard key={prospect.id} prospect={prospect} />
            ))}
          </div>
        </SortableContext>

        {prospects.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-xs text-muted-foreground/40">Glisser ici</p>
          </div>
        )}
      </div>
    </div>
  )
}
