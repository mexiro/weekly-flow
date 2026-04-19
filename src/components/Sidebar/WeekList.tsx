import { useState } from 'react'
import { useWeekStore }  from '../../store/weekStore'
import { useUIStore }    from '../../store/uiStore'
import { useTaskStore }  from '../../store/taskStore'
import { getCurrentWeekNumber, getCurrentYear, weekProgress } from '../../utils/weekUtils'
import { NewWeekModal }  from './NewWeekModal'

export function WeekList() {
  const { pages }                         = useWeekStore()
  const { tasks }                         = useTaskStore()
  const { activeWeekId, setActiveWeekId } = useUIStore()
  const [showModal, setShowModal]         = useState(false)

  const currentWN   = getCurrentWeekNumber()
  const currentYear = getCurrentYear()

  const sorted = Object.values(pages).sort((a, b) =>
    a.year !== b.year ? b.year - a.year : b.weekNumber - a.weekNumber
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      {showModal && <NewWeekModal onClose={() => setShowModal(false)} />}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 0 8px',
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const,
          letterSpacing: '0.08em', color: 'var(--ink-3)',
        }}>
          Weekly pages
        </div>
        <button onClick={() => setShowModal(true)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
          textTransform: 'uppercase' as const, letterSpacing: '0.05em',
        }}>
          + new
        </button>
      </div>

      {sorted.length === 0 && (
        <p style={{ padding: '0 18px', fontSize: 13, color: 'var(--ink-4)', fontFamily: 'var(--sans)' }}>
          No pages yet
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sorted.map(page => {
          const isActive  = page.id === activeWeekId
          const isFuture  = page.year > currentYear ||
            (page.year === currentYear && page.weekNumber > currentWN)
          const { total, pct } = weekProgress(tasks, page.id)
          const range = page.title.split('·')[1]?.trim() ?? ''

          return (
            <button key={page.id} onClick={() => setActiveWeekId(page.id)} style={{
              all: 'unset' as any, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              background: isActive ? '#fffcf3' : 'transparent',
              border: isActive ? '1px solid var(--rule)' : '1px solid transparent',
              boxShadow: isActive ? '0 1px 0 rgba(0,0,0,0.03)' : 'none',
              opacity: isFuture ? 0.5 : 1,
              transition: 'background 0.12s',
            }}>
              <div style={{
                fontFamily: 'var(--display)', fontWeight: isActive ? 600 : 500,
                fontSize: 13.5, color: 'var(--ink)', flexShrink: 0,
              }}>
                CW{page.weekNumber}
              </div>
              <div style={{
                flex: 1, fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--sans)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              }}>
                {range}
              </div>
              {isActive && total > 0 && (
                <div style={{
                  width: 36, height: 3, background: 'var(--rule)',
                  borderRadius: 999, overflow: 'hidden', flexShrink: 0,
                }}>
                  <div style={{
                    height: '100%', width: `${Math.round(pct * 100)}%`,
                    background: 'var(--accent)', borderRadius: 999,
                  }} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
