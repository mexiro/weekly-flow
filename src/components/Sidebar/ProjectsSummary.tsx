import { useProjectStore } from '../../store/projectStore'
import { useUIStore }      from '../../store/uiStore'

export function ProjectsSummary() {
  const { projects }      = useProjectStore()
  const { setActiveView } = useUIStore()

  const active = Object.values(projects)
    .filter(p => p.status === 'active')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, 3)

  if (active.length === 0) return null

  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const,
          letterSpacing: '0.08em', color: 'var(--ink-3)',
        }}>
          Projects · {active.length}
        </div>
        <button onClick={() => setActiveView('kanban')} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
          textTransform: 'uppercase' as const, letterSpacing: '0.05em',
        }}>
          view all →
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {active.map(p => {
          const total = p.tasks.length
          const done  = p.tasks.filter(t => t.done).length
          const pct   = total === 0 ? 0 : done / total
          const isLow = pct < 0.2 && total > 0
          return (
            <div key={p.id} style={{
              padding: '8px 10px', borderRadius: 8,
              background: '#fffcf3', border: '1px solid var(--rule)',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: 4,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 500, color: 'var(--ink)',
                  fontFamily: 'var(--sans)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  maxWidth: 160,
                }}>
                  {p.title}
                </div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
                  textTransform: 'uppercase' as const, letterSpacing: '0.05em', flexShrink: 0,
                }}>
                  {Math.round(pct * 100)}%
                </div>
              </div>
              <div style={{ height: 4, background: 'var(--rule)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.round(pct * 100)}%`,
                  background: isLow ? 'var(--ochre)' : 'var(--accent)',
                  borderRadius: 999,
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
