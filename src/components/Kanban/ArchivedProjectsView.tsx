import { useState } from 'react'
import { parseISO } from 'date-fns'
import { useProjectStore } from '../../store/projectStore'
import type { Project } from '../../types'

interface Props {
  onBack: () => void
}

function formatDate(iso: string): string {
  const d = parseISO(iso)
  return d.toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ArchivedRow({ project, onRestore }: { project: Project; onRestore: () => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px',
      background: '#fff', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14,
            fontWeight: 600, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {project.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: "'Inter', system-ui, sans-serif", marginTop: 2 }}>
            {project.status === 'completed' && project.completedAt
              ? `Completed ${formatDate(project.completedAt)}`
              : project.archivedAt
              ? `Archived ${formatDate(project.archivedAt)}`
              : null}
            {project.assignee && (
              <span style={{ marginLeft: 8, color: 'var(--accent)' }}>@{project.assignee}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {project.tasks.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                padding: '3px 8px', fontSize: 11, cursor: 'pointer',
                fontFamily: "'Inter', system-ui, sans-serif", color: 'var(--text-secondary)',
              }}
            >
              {expanded ? 'Hide tasks' : `${project.tasks.length} task${project.tasks.length !== 1 ? 's' : ''}`}
            </button>
          )}
          <button
            onClick={onRestore}
            style={{
              background: 'var(--accent-light)', border: 'none', borderRadius: 6,
              padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 500,
              fontFamily: "'Inter', system-ui, sans-serif", color: 'var(--accent)',
            }}
          >
            Restore
          </button>
        </div>
      </div>

      {expanded && project.tasks.length > 0 && (
        <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          {project.tasks.map((task) => (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0',
              fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif",
              color: task.done ? 'var(--text-secondary)' : 'var(--text-primary)',
              textDecoration: task.done ? 'line-through' : 'none',
            }}>
              <span style={{ color: task.done ? '#10b981' : 'var(--text-secondary)', fontSize: 12 }}>
                {task.done ? '✓' : '○'}
              </span>
              {task.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ArchivedProjectsView({ onBack }: Props) {
  const { projects, unarchiveProject } = useProjectStore()

  const archived = Object.values(projects)
    .filter((p) => p.status === 'archived' || p.status === 'completed')
    .sort((a, b) => {
      const dateA = a.completedAt ?? a.archivedAt ?? a.updatedAt
      const dateB = b.completedAt ?? b.archivedAt ?? b.updatedAt
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 18,
            color: 'var(--text-secondary)', padding: 0, lineHeight: 1,
          }}
          title="Back to projects"
        >
          ←
        </button>
        <h2 style={{
          margin: 0, fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 20, fontWeight: 600, color: 'var(--text-primary)',
        }}>
          Archived Projects
        </h2>
      </div>

      {archived.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: 'var(--text-secondary)', fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 14,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
          No archived projects yet.
        </div>
      ) : (
        <div>
          {archived.map((project) => (
            <ArchivedRow
              key={project.id}
              project={project}
              onRestore={() => unarchiveProject(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
