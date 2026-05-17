'use client'

import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { GripVertical, Users } from 'lucide-react'
import type { ProspectWithDecisionMakers } from '@/lib/types/database'
import { scoreColor, avatarColor } from '@/lib/utils/score'

interface KanbanCardProps {
  prospect: ProspectWithDecisionMakers
  isDragging?: boolean
  /** Poignée tactile (overlay de drag : toujours masquée). */
  showDragHandle?: boolean
}

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isMobile
}

export function KanbanCard({
  prospect: p,
  isDragging = false,
  showDragHandle = true,
}: KanbanCardProps) {
  const didDragRef = useRef(false)
  const isMobile = useIsMobileViewport()
  const useTouchHandle = showDragHandle && isMobile

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

  if (isSortableDragging) {
    didDragRef.current = true
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.35 : 1,
  }

  const dragProps = useTouchHandle ? {} : { ...attributes, ...listeners }

  const cardBody = (
    <div
      className={`min-w-0 flex-1 space-y-2.5 overflow-hidden rounded-lg border bg-card p-3 transition-all ${
        isDragging
          ? 'border-primary/40 shadow-xl'
          : 'border-border hover:border-border/80 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight">{p.company_name}</p>
          {p.sector && (
            <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">
              {p.sector.replace('_', ' ')}
            </p>
          )}
        </div>
        {p.p1_score != null && (
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-xs font-bold ${scoreColor(p.p1_score)}`}
          >
            {p.p1_score}
          </span>
        )}
      </div>

      <div className="flex min-w-0 items-center justify-between gap-2">
        {p.open_positions_count != null && (
          <span className="flex min-w-0 shrink items-center gap-1 truncate text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {p.open_positions_count} poste{p.open_positions_count > 1 ? 's' : ''}
          </span>
        )}

        {p.decision_makers && p.decision_makers.length > 0 && (
          <div className="flex shrink-0 -space-x-1.5">
            {p.decision_makers.slice(0, 3).map((dm) => (
              <div
                key={dm.id}
                title={`${dm.full_name} — ${dm.role}`}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-background text-[9px] font-bold ${avatarColor(dm.full_name)}`}
              >
                {dm.full_name.charAt(0).toUpperCase()}
              </div>
            ))}
            {p.decision_makers.length > 3 && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-background bg-muted text-[9px] font-bold text-muted-foreground">
                +{p.decision_makers.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex w-full min-w-0 max-w-full overflow-hidden ${
        useTouchHandle ? '' : 'cursor-grab active:cursor-grabbing select-none'
      }`}
      {...dragProps}
    >
      {useTouchHandle && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="touch-none flex shrink-0 cursor-grab items-center self-stretch rounded-l-md px-1.5 text-muted-foreground/50 active:cursor-grabbing active:bg-muted/40 hover:text-muted-foreground"
          aria-label="Déplacer la carte"
          onClick={(e) => e.preventDefault()}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}
      <Link
        href={`/prospects/${p.id}`}
        className="block min-w-0 flex-1"
        onClick={(e) => {
          if (didDragRef.current) {
            e.preventDefault()
            didDragRef.current = false
          }
        }}
      >
        {cardBody}
      </Link>
    </div>
  )
}
