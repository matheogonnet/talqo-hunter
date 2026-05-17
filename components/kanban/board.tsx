'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
} from '@dnd-kit/core'
import type { CollisionDetection } from '@dnd-kit/core'
import { KanbanColumn } from './column'
import { KanbanCard } from './card'
import type { ProspectStatus, ProspectWithDecisionMakers } from '@/lib/types/database'
import { updateProspectStatus } from '@/lib/actions/prospects'
import { toast } from 'sonner'

interface KanbanBoardProps {
  columns: { status: ProspectStatus; label: string }[]
  grouped: Record<ProspectStatus, ProspectWithDecisionMakers[]>
}

/** Priorise la position du doigt (tactile), puis les coins les plus proches. */
const kanbanCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args)
  if (pointerHits.length > 0) return pointerHits
  return closestCorners(args)
}

export function KanbanBoard({ columns, grouped: initialGrouped }: KanbanBoardProps) {
  const [grouped, setGrouped] = useState(initialGrouped)
  const [activeProspect, setActiveProspect] = useState<ProspectWithDecisionMakers | null>(null)
  /** Colonne au début du drag — l’état `grouped` est déjà déplacé dans handleDragOver, donc on ne peut pas en déduire la source au drop. */
  const dragSourceStatusRef = useRef<ProspectStatus | null>(null)

  useEffect(() => {
    setGrouped(initialGrouped)
  }, [initialGrouped])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 280, tolerance: 12 },
    })
  )

  const findProspect = useCallback(
    (id: string) => {
      for (const status of Object.keys(grouped) as ProspectStatus[]) {
        const found = grouped[status].find((p) => p.id === id)
        if (found) return { prospect: found, fromStatus: status }
      }
      return null
    },
    [grouped]
  )

  function handleDragStart(event: DragStartEvent) {
    const found = findProspect(event.active.id as string)
    if (found) {
      setActiveProspect(found.prospect)
      dragSourceStatusRef.current = found.fromStatus
    } else {
      dragSourceStatusRef.current = null
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const found = findProspect(activeId)
    if (!found) return

    const { fromStatus } = found

    const toStatus = (over.data.current?.status ?? overId) as ProspectStatus

    if (fromStatus === toStatus) return

    setGrouped((prev) => {
      const newGrouped = { ...prev }
      newGrouped[fromStatus] = prev[fromStatus].filter((p) => p.id !== activeId)
      newGrouped[toStatus] = [
        ...prev[toStatus],
        { ...found.prospect, status: toStatus },
      ]
      return newGrouped
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveProspect(null)

    const sourceStatus = dragSourceStatusRef.current
    dragSourceStatusRef.current = null

    if (!over || !sourceStatus) return

    const activeId = active.id as string
    const toStatus = (over.data.current?.status ?? over.id) as ProspectStatus

    if (sourceStatus === toStatus) return

    const result = await updateProspectStatus(activeId, toStatus)
    if (!result.success) {
      toast.error('Erreur lors de la mise à jour du status', {
        description: result.error,
      })
      setGrouped(initialGrouped)
    }
  }

  function handleDragCancel() {
    setActiveProspect(null)
    dragSourceStatusRef.current = null
    setGrouped(initialGrouped)
  }

  const autoScroll = useMemo(
    () => ({
      threshold: { x: 0.12, y: 0.2 },
      acceleration: 12,
      interval: 8,
    }),
    []
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={kanbanCollisionDetection}
      autoScroll={autoScroll}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className="flex h-full min-h-0 snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden px-3 py-3 scroll-pl-3 scroll-pr-3 touch-pan-x overscroll-x-contain scrollbar-thin sm:gap-4 sm:px-6 sm:py-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            prospects={grouped[col.status] ?? []}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeProspect && (
          <div className="w-[min(85vw,22rem)] rotate-1 opacity-95 shadow-2xl">
            <KanbanCard prospect={activeProspect} isDragging showDragHandle={false} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
