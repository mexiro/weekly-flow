import { useRef, useState, KeyboardEvent } from 'react'
import type { ProjectTask } from '../../types'
import { useProjectStore } from '../../store/projectStore'

interface ProjectTaskRowProps {
  projectId: string
  task: ProjectTask
}

export function ProjectTaskRow({ projectId, task }: ProjectTaskRowProps) {
  const { toggleTask, updateTaskText, deleteTask } = useProjectStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.text)
  const inputRef = useRef<HTMLInputElement>(null)

  const commitEdit = () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      deleteTask(projectId, task.id)
    } else {
      updateTaskText(projectId, task.id, trimmed)
    }
    setEditing(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { setDraft(task.text); setEditing(false) }
  }

  return (
    <div className="project-task-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '5px 0' }}>
      {/* Custom checkbox */}
      <label style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 2, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => toggleTask(projectId, task.id)}
          className="project-checkbox"
        />
      </label>

      {/* Task text */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13,
            color: 'var(--text-primary)', padding: 0,
          }}
        />
      ) : (
        <span
          onDoubleClick={() => { setDraft(task.text); setEditing(true) }}
          style={{
            flex: 1,
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 13,
            color: task.done ? 'var(--text-secondary)' : 'var(--text-primary)',
            textDecoration: task.done ? 'line-through' : 'none',
            cursor: 'text',
            lineHeight: 1.5,
          }}
        >
          {task.text}
        </span>
      )}
    </div>
  )
}
