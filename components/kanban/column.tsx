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
    <div className="flex-shrink-0 w-56 sm:w-64 flex flex-col gap-2">
      {/* Header colonne */}
      <div className="flex items-center justify-between px-1 gap-1">
        <span className={`text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 min-w-0 ${isRejected ? 'text-red-400' : 'text-muted-foreground'}`}>
          {(status === 'connection_sent' || status === 'connected') && (
            <span title="Étapes côté LinkedIn" className="inline-flex shrink-0">
              <LinkedInMark className="w-3.5 h-3.5" />
            </span>
          )}
          <span className="truncate">{label}</span>
        </span>
        {prospects.length > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${isRejected ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-muted-foreground'}`}>
            {prospects.length}
          </span>
        )}
      </div>

      {/* Zone de drop */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[120px] rounded-xl border-2 border-dashed transition-colors p-1.5 space-y-1.5 ${
          isOver
            ? isRejected ? 'border-red-400 bg-red-50' : 'border-primary bg-blue-50'
            : isRejected ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'
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
