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

  return (
    <div className="flex-shrink-0 w-64 flex flex-col gap-2">
      {/* Header colonne */}
      <div className="flex items-center justify-between px-1 gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5 min-w-0">
          {(status === 'connection_sent' || status === 'connected') && (
            <span title="Étapes côté LinkedIn" className="inline-flex shrink-0">
              <LinkedInMark className="w-3.5 h-3.5" />
            </span>
          )}
          <span className="truncate">{label}</span>
        </span>
        {prospects.length > 0 && (
          <span className="text-xs text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded-full">
            {prospects.length}
          </span>
        )}
      </div>

      {/* Zone de drop */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[120px] rounded-xl border-2 border-dashed transition-colors p-1.5 space-y-1.5 ${
          isOver
            ? 'border-primary bg-blue-50'
            : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        <SortableContext
          items={prospects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {prospects.map((prospect) => (
            <KanbanCard key={prospect.id} prospect={prospect} />
          ))}
        </SortableContext>

        {prospects.length === 0 && (
          <div className="h-full flex items-center justify-center py-6">
            <p className="text-xs text-muted-foreground/30">Vide</p>
          </div>
        )}
      </div>
    </div>
  )
}
