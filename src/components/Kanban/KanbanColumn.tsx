import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'
import type { Task } from '../../types'

interface KanbanColumnProps {
  id: 'todo' | 'doing' | 'done'
  label: string
  tasks: Task[]
  isOver?: boolean
}

const COLUMN_COLORS: Record<string, { dot: string; header: string }> = {
  todo:  { dot: '#9ca3af', header: '#6b7280' },
  doing: { dot: '#f59e0b', header: '#d97706' },
  done:  { dot: '#10b981', header: '#059669' },
}

export function KanbanColumn({ id, label, tasks, isOver }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id })
  const colors = COLUMN_COLORS[id]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: isOver ? '#f0f1ff' : '#f8f9fa',
      borderRadius: 10, padding: '14px 12px',
      minHeight: 300,
      transition: 'background 0.15s',
      flex: 1,
    }}>
      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.header, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 11, fontWeight: 600,
          background: '#e5e7eb', color: '#6b7280',
          borderRadius: 10, padding: '1px 7px',
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {tasks.length === 0 && (
            <p style={{ fontSize: 12, color: '#d1d5db', textAlign: 'center', marginTop: 24 }}>
              No tasks
            </p>
          )}
          {tasks.map(task => <KanbanCard key={task.id} task={task} />)}
        </div>
      </SortableContext>
    </div>
  )
}
