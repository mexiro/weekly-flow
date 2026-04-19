import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { KanbanTabs } from './KanbanTabs'
import { ProjectsBoard } from './ProjectsBoard'
import { useTaskStore } from '../../store/taskStore'
import { useWeekStore } from '../../store/weekStore'
import { useUIStore } from '../../store/uiStore'
import type { Task, KanbanTab } from '../../types'

const COLUMNS: { id: 'todo' | 'doing' | 'done'; label: string }[] = [
  { id: 'todo',  label: 'To Do' },
  { id: 'doing', label: 'Doing' },
  { id: 'done',  label: 'Done' },
]

export function KanbanBoard() {
  const { tasks, updateTaskStatus, reconcileTasks } = useTaskStore()
  const { pages, updatePageContent } = useWeekStore()
  const { activeWeekId } = useUIStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [overColumn, setOverColumn] = useState<Task['status'] | null>(null)
  const [activeTab, setActiveTab] = useState<KanbanTab>('week')
  const [filterThisWeek, setFilterThisWeek] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function getColumn(id: string): Task['status'] | null {
    if (COLUMNS.find(c => c.id === id)) return id as Task['status']
    return tasks.find(t => t.id === id)?.status ?? null
  }

  function onDragStart({ active }: DragStartEvent) {
    setActiveTask(tasks.find(t => t.id === active.id) ?? null)
  }

  function onDragOver({ over }: DragOverEvent) {
    setOverColumn(over ? getColumn(over.id as string) : null)
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
    setOverColumn(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const draggedTask = tasks.find(t => t.id === activeId)
    if (!draggedTask) return

    const destColumn = getColumn(overId)
    if (!destColumn) return

    if (draggedTask.status === destColumn) {
      // Reorder within same column
      const colTasks = visibleTasks(destColumn)
      const oldIndex = colTasks.findIndex(t => t.id === activeId)
      const newIndex = colTasks.findIndex(t => t.id === overId)
      if (oldIndex === newIndex) return
      // No-op reorder in persisted store — visual order is not persisted yet
      return
    }

    // Update status in task store
    updateTaskStatus(activeId, destColumn)

    // Sync checked state back to editor content (two-way sync)
    // Write to every page this task appears in
    const checked = destColumn === 'done'
    for (const occ of draggedTask.occurrences) {
      const page = pages[occ.weekId]
      if (!page?.content?.content) continue
      const updatedContent = syncTaskInContent(page.content, draggedTask.title, checked)
      updatePageContent(occ.weekId, updatedContent)
    }

    // Re-reconcile so the store reflects the editor update
    setTimeout(() => reconcileTasks(pages), 0)
  }

  const visibleTasks = (colId: Task['status']): Task[] => {
    let filtered = tasks.filter(t => t.status === colId)
    if (filterThisWeek && activeWeekId) {
      filtered = filtered.filter(t =>
        t.occurrences.some(o => o.weekId === activeWeekId)
      )
    }
    return filtered
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ padding: '32px 32px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0, fontFamily: "'Inter', system-ui, sans-serif" }}>
            Kanban
          </h2>
          {activeTab === 'week' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <FilterChip label="All weeks" active={!filterThisWeek} onClick={() => setFilterThisWeek(false)} />
              <FilterChip label="This week" active={filterThisWeek} onClick={() => setFilterThisWeek(true)} />
            </div>
          )}
        </div>
      </div>

      <KanbanTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === 'week' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {COLUMNS.map(col => (
                <KanbanColumn key={col.id} id={col.id} label={col.label} tasks={visibleTasks(col.id)} isOver={overColumn === col.id} />
              ))}
            </div>
            <DragOverlay>
              {activeTask && <KanbanCard task={activeTask} />}
            </DragOverlay>
          </DndContext>
        </div>
      ) : (
        <ProjectsBoard />
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer',
        fontFamily: "'Inter', system-ui, sans-serif", border: '1px solid',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        background: active ? 'var(--accent-light)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

// Walk Tiptap JSON and flip the checked attr of a matching taskItem
function syncTaskInContent(content: any, title: string, checked: boolean): any {
  if (!content || typeof content !== 'object') return content

  if (content.type === 'taskItem') {
    const text = extractText(content).trim()
    if (text === title) {
      return { ...content, attrs: { ...content.attrs, checked } }
    }
  }

  if (content.content) {
    return { ...content, content: content.content.map((n: any) => syncTaskInContent(n, title, checked)) }
  }

  return content
}

function extractText(node: any): string {
  if (node.text) return node.text
  if (node.content) return node.content.map(extractText).join('')
  return ''
}
