import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { ProjectCard } from './ProjectCard'
import { EmptyProjectsState } from './EmptyProjectsState'
import { ArchivedProjectsView } from './ArchivedProjectsView'

export function ProjectsBoard() {
  const { projects, addProject } = useProjectStore()
  const [showArchive, setShowArchive] = useState(false)

  const allProjects = Object.values(projects)
  const activeProjects = allProjects
    .filter((p) => p.status === 'active')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const archivedCount = allProjects.filter((p) => p.status === 'archived' || p.status === 'completed').length

  const newProjectIdRef = useRef<string | null>(null)

  const handleAddProject = () => {
    const project = addProject('New Project')
    newProjectIdRef.current = project.id
  }

  // Focus the new project's title after it renders
  useEffect(() => {
    if (newProjectIdRef.current) {
      const id = newProjectIdRef.current
      newProjectIdRef.current = null
      setTimeout(() => {
        const el = document.querySelector(`[data-project-id="${id}"] h3`) as HTMLElement | null
        el?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
      }, 50)
    }
  }, [activeProjects.length])

  const softLimitReached = activeProjects.length >= 5

  if (showArchive) {
    return <ArchivedProjectsView onBack={() => setShowArchive(false)} />
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
      {/* Board header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{
          margin: 0, fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 20, fontWeight: 600, color: 'var(--text-primary)',
        }}>
          Projects
        </h2>
        <button
          onClick={handleAddProject}
          style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 500,
            fontFamily: "'Inter', system-ui, sans-serif", cursor: 'pointer',
          }}
        >
          + New Project
        </button>
      </div>

      {softLimitReached && (
        <p style={{
          fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13,
          color: 'var(--text-secondary)', marginBottom: 20, marginTop: 8,
        }}>
          You have {activeProjects.length} open projects — consider closing some.
        </p>
      )}

      {/* Archive link */}
      {archivedCount > 0 && (
        <button
          onClick={() => setShowArchive(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'Inter', system-ui, sans-serif",
            marginBottom: 20, marginTop: softLimitReached ? 0 : 8,
            textDecoration: 'underline',
          }}
        >
          View archived ({archivedCount})
        </button>
      )}

      {activeProjects.length === 0 ? (
        <EmptyProjectsState onAdd={handleAddProject} />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 24,
          alignItems: 'start',
        }}>
          {activeProjects.map((project) => (
            <div key={project.id} data-project-id={project.id}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
