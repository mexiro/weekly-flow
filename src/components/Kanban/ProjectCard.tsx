import { useRef, useState, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { differenceInCalendarWeeks, parseISO } from 'date-fns'
import type { Project } from '../../types'
import { useProjectStore } from '../../store/projectStore'
import { ProjectTaskRow } from './ProjectTaskRow'

interface ProjectCardProps {
  project: Project
}

function weeksOpen(createdAt: string): string {
  const weeks = differenceInCalendarWeeks(new Date(), parseISO(createdAt))
  if (weeks < 1) return 'Opened this week'
  return `Open ${weeks}w`
}

function completedLabel(completedAt: string, createdAt: string): string {
  const date = parseISO(completedAt)
  const month = date.toLocaleString('en', { month: 'short' })
  const day = date.getDate()
  const weeks = differenceInCalendarWeeks(parseISO(completedAt), parseISO(createdAt))
  const duration = weeks < 1 ? 'same week' : `${weeks}w total`
  return `Completed ${month} ${day} · ${duration}`
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { updateProjectTitle, updateProjectAssignee, deleteProject, archiveProject, addTask } = useProjectStore()

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(project.title)
  const [editingAssignee, setEditingAssignee] = useState(false)
  const [assigneeDraft, setAssigneeDraft] = useState(project.assignee ?? '')
  const [newTaskText, setNewTaskText] = useState('')
  const [hovered, setHovered] = useState(false)
  const [showCompletedBadge, setShowCompletedBadge] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const newTaskRef = useRef<HTMLInputElement>(null)
  const prevStatusRef = useRef(project.status)

  // Show "✓ Completed" badge briefly when project transitions to completed
  useEffect(() => {
    if (prevStatusRef.current !== 'completed' && project.status === 'completed') {
      setShowCompletedBadge(true)
      const timer = setTimeout(() => setShowCompletedBadge(false), 2500)
      prevStatusRef.current = project.status
      return () => clearTimeout(timer)
    }
    prevStatusRef.current = project.status
  }, [project.status])

  const commitTitle = () => {
    const trimmed = titleDraft.trim()
    updateProjectTitle(project.id, trimmed || project.title)
    setTitleDraft(trimmed || project.title)
    setEditingTitle(false)
  }

  const commitAssignee = () => {
    updateProjectAssignee(project.id, assigneeDraft)
    setEditingAssignee(false)
  }

  const handleNewTaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = newTaskText.trim()
      if (trimmed) {
        addTask(project.id, trimmed)
        setNewTaskText('')
      }
    }
    if (e.key === 'Escape') {
      setNewTaskText('')
      newTaskRef.current?.blur()
    }
  }

  const doneTasks = project.tasks.filter((t) => t.done).length
  const totalTasks = project.tasks.length

  return (
    <div
      className="project-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 20px 16px',
        boxShadow: hovered ? 'var(--card-hover-shadow)' : 'var(--card-shadow)',
        transition: 'box-shadow 0.15s',
        position: 'relative',
        minWidth: 0,
      }}
    >
      {/* Completion badge */}
      {showCompletedBadge && (
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: '#fff', borderRadius: 999,
          padding: '3px 12px', fontSize: 12, fontWeight: 600,
          fontFamily: "'Inter', system-ui, sans-serif",
          animation: 'fadeIn 0.2s ease',
          whiteSpace: 'nowrap',
          zIndex: 2,
        }}>
          ✓ Completed
        </div>
      )}

      {/* Archive / Delete menu button */}
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          title="Options"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, color: '#9ca3af', lineHeight: 1, padding: 2,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s',
          }}
        >
          ···
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute', top: 22, right: 0, background: '#fff',
            border: '1px solid var(--border)', borderRadius: 8,
            boxShadow: 'var(--card-hover-shadow)', zIndex: 10,
            minWidth: 130, padding: '4px 0',
          }}>
            <button
              onClick={() => { setMenuOpen(false); archiveProject(project.id) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 14px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif",
                color: 'var(--text-primary)',
              }}
            >
              Archive
            </button>
            <button
              onClick={() => {
                setMenuOpen(false)
                if (window.confirm(`Delete "${project.title}"? This cannot be undone.`)) {
                  deleteProject(project.id)
                }
              }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 14px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif",
                color: '#ef4444',
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Header: title + assignee */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4, paddingRight: 24 }}>
        {editingTitle ? (
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitleDraft(project.title); setEditingTitle(false) } }}
            autoFocus
            style={{
              flex: 1, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 16,
              fontWeight: 600, color: 'var(--text-primary)', border: 'none',
              borderBottom: '1px dashed var(--accent)', outline: 'none',
              background: 'transparent', padding: '0 0 2px',
            }}
          />
        ) : (
          <h3
            onDoubleClick={() => { setTitleDraft(project.title); setEditingTitle(true) }}
            title="Double-click to edit"
            style={{
              margin: 0, fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 16, fontWeight: 600, color: 'var(--text-primary)',
              cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', maxWidth: 260, flex: 1,
            }}
          >
            {project.title}
          </h3>
        )}
      </div>

      {/* Assignee */}
      <div style={{ marginBottom: 6 }}>
        {editingAssignee ? (
          <input
            value={assigneeDraft}
            onChange={(e) => setAssigneeDraft(e.target.value)}
            onBlur={commitAssignee}
            onKeyDown={(e) => { if (e.key === 'Enter') commitAssignee(); if (e.key === 'Escape') { setAssigneeDraft(project.assignee ?? ''); setEditingAssignee(false) } }}
            autoFocus
            placeholder="Assignee name"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12,
              border: '1px dashed var(--border)', borderRadius: 999,
              padding: '2px 10px', outline: 'none', color: 'var(--accent)',
              background: 'var(--accent-light)',
            }}
          />
        ) : project.assignee ? (
          <span
            onDoubleClick={() => { setAssigneeDraft(project.assignee ?? ''); setEditingAssignee(true) }}
            title="Double-click to edit assignee"
            style={{
              display: 'inline-block', background: 'var(--accent-light)',
              color: 'var(--accent)', borderRadius: 999, padding: '2px 10px',
              fontSize: 12, fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif",
              cursor: 'text',
            }}
          >
            @{project.assignee}
          </span>
        ) : (
          <button
            onClick={() => { setAssigneeDraft(''); setEditingAssignee(true) }}
            style={{
              background: 'none', border: '1px dashed var(--border)', borderRadius: 999,
              padding: '2px 10px', fontSize: 12, color: 'var(--text-secondary)',
              fontFamily: "'Inter', system-ui, sans-serif", cursor: 'pointer',
            }}
          >
            + assignee
          </button>
        )}
      </div>

      {/* Open duration / completion date */}
      <div style={{ marginBottom: 10, fontSize: 11, color: 'var(--text-secondary)', fontFamily: "'Inter', system-ui, sans-serif" }}>
        {project.status === 'completed' && project.completedAt
          ? completedLabel(project.completedAt, project.createdAt)
          : weeksOpen(project.createdAt)}
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'var(--accent)',
              width: `${Math.round((doneTasks / totalTasks) * 100)}%`,
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: "'Inter', system-ui, sans-serif", marginTop: 4, display: 'block' }}>
            {doneTasks}/{totalTasks} done
          </span>
        </div>
      )}

      {/* Task list */}
      <div style={{ marginBottom: 4 }}>
        {project.tasks.map((task) => (
          <ProjectTaskRow key={task.id} projectId={project.id} task={task} />
        ))}
      </div>

      {/* Add task input */}
      <input
        ref={newTaskRef}
        value={newTaskText}
        onChange={(e) => setNewTaskText(e.target.value)}
        onKeyDown={handleNewTaskKeyDown}
        placeholder="+ add task"
        style={{
          width: '100%', border: 'none', outline: 'none', background: 'transparent',
          fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13,
          color: 'var(--text-secondary)', padding: '5px 0',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
        onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
      />
    </div>
  )
}
