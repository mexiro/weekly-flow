import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { differenceInCalendarWeeks, parseISO } from 'date-fns'
import type { Task } from '../../types'
import { useWeekStore } from '../../store/weekStore'

interface KanbanCardProps {
  task: Task
}

function carryOverLabel(task: Task, pages: Record<string, any>): string | null {
  if (task.occurrences.length <= 1) return null
  const originPage = pages[task.originWeekId]
  if (!originPage) return `↻ from ${task.originWeekId}`
  const weeks = differenceInCalendarWeeks(new Date(), parseISO(originPage.createdAt))
  if (weeks < 1) return `↻ from ${task.originWeekId}`
  return `↻ from ${task.originWeekId} · ${weeks}w open`
}

export function KanbanCard({ task }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const { pages } = useWeekStore()
  const carryOver = carryOverLabel(task, pages)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="kanban-card"
    >
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.4 }}>
        {task.title}
      </p>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 11, padding: '2px 7px', borderRadius: 4,
          background: '#f3f4f6', color: '#6b7280', fontWeight: 500,
        }}>
          {task.dayLabel}
        </span>
        <span style={{
          fontSize: 11, padding: '2px 7px', borderRadius: 4,
          background: '#eef2ff', color: '#4f46e5', fontWeight: 500,
        }}>
          {task.originWeekId}
        </span>
        {carryOver && (
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 4,
            background: '#fff7ed', color: '#c2410c', fontWeight: 500,
          }}>
            {carryOver}
          </span>
        )}
      </div>
    </div>
  )
}
