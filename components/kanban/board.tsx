'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
} from '@dnd-kit/core'
import { KanbanColumn } from './column'
import { KanbanCard } from './card'
import type { ProspectStatus, ProspectWithDecisionMakers } from '@/lib/types/database'
import { updateProspectStatus } from '@/lib/actions/prospects'
import { toast } from 'sonner'

interface KanbanBoardProps {
  columns: { status: ProspectStatus; label: string }[]
  grouped: Record<ProspectStatus, ProspectWithDecisionMakers[]>
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
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
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

    // La cible peut être soit une colonne (son status), soit une carte (on cherche sa colonne)
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 h-full overflow-x-auto px-4 sm:px-6 py-4 scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            prospects={grouped[col.status] ?? []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProspect && (
          <div className="rotate-2 opacity-90">
            <KanbanCard prospect={activeProspect} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
