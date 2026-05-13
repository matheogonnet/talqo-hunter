'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import type { ProspectWithDecisionMakers } from '@/lib/types/database'
import { scoreColor, companyInitials, avatarColor } from '@/lib/utils/score'
import { Users } from 'lucide-react'

interface KanbanCardProps {
  prospect: ProspectWithDecisionMakers
  isDragging?: boolean
}

export function KanbanCard({ prospect: p, isDragging = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: p.id,
    data: { status: p.status, prospect: p },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  const card = (
    <div
      className={`rounded-lg border bg-card p-3 space-y-2.5 cursor-grab active:cursor-grabbing select-none
        ${isDragging ? 'shadow-xl border-primary/40' : 'border-border hover:border-border/80 hover:shadow-sm'}
        transition-all`}
    >
      {/* Nom + score */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm leading-tight truncate">{p.company_name}</p>
          {p.sector && (
            <p className="text-xs text-muted-foreground capitalize mt-0.5 truncate">
              {p.sector.replace('_', ' ')}
            </p>
          )}
        </div>
        {p.p1_score != null && (
          <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold ${scoreColor(p.p1_score)}`}>
            {p.p1_score}
          </span>
        )}
      </div>

      {/* Postes ouverts + décideurs */}
      <div className="flex items-center justify-between">
        {p.open_positions_count != null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            {p.open_positions_count} poste{p.open_positions_count > 1 ? 's' : ''}
          </span>
        )}

        {/* Avatars décideurs (max 3) */}
        {p.decision_makers && p.decision_makers.length > 0 && (
          <div className="flex -space-x-1.5">
            {p.decision_makers.slice(0, 3).map((dm) => (
              <div
                key={dm.id}
                title={`${dm.full_name} — ${dm.role}`}
                className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center border border-background flex-shrink-0 ${avatarColor(dm.full_name)}`}
              >
                {dm.full_name.charAt(0).toUpperCase()}
              </div>
            ))}
            {p.decision_makers.length > 3 && (
              <div className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center border border-background bg-muted text-muted-foreground">
                +{p.decision_makers.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/prospects/${p.id}`} onClick={(e) => {
        // Empêche la navigation si on est en train de drag
        if (isSortableDragging) e.preventDefault()
      }}>
        {card}
      </Link>
    </div>
  )
}
