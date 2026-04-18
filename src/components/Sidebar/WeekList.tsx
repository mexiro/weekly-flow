import { useState } from 'react'
import { useWeekStore } from '../../store/weekStore'
import { useUIStore } from '../../store/uiStore'
import { getCurrentWeekNumber, getCurrentYear } from '../../utils/weekUtils'
import { NewWeekModal } from './NewWeekModal'

export function WeekList() {
  const { pages } = useWeekStore()
  const { activeWeekId, setActiveWeekId } = useUIStore()
  const currentWeekId = `CW${getCurrentWeekNumber()}-${getCurrentYear()}`
  const [showModal, setShowModal] = useState(false)

  const sortedPages = Object.values(pages).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.weekNumber - a.weekNumber
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
      {showModal && <NewWeekModal onClose={() => setShowModal(false)} />}

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px 8px' }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(226,232,240,0.4)' }}>
          Weekly Pages
        </span>
        <button
          onClick={() => setShowModal(true)}
          style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 5, border: 'none', cursor: 'pointer',
            color: 'rgba(226,232,240,0.55)', background: 'rgba(255,255,255,0.07)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          + New
        </button>
      </div>

      {sortedPages.length === 0 && (
        <p style={{ padding: '0 14px', fontSize: 13, color: 'rgba(226,232,240,0.3)' }}>No pages yet</p>
      )}

      <ul style={{ listStyle: 'none', padding: '0 8px', margin: 0 }}>
        {sortedPages.map((page) => {
          const isActive = page.id === activeWeekId
          const isCurrent = page.id === currentWeekId
          const dateRange = page.title.includes('·') ? page.title.split('·')[1]?.trim() : ''
          return (
            <li key={page.id}>
              <button
                onClick={() => setActiveWeekId(page.id)}
                style={{
                  width: '100%', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: isActive ? 'rgba(79,70,229,0.28)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{page.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: isActive ? '#fff' : 'var(--text-sidebar)', margin: 0, lineHeight: 1.3 }}>
                      CW{page.weekNumber}
                    </p>
                    {isCurrent && (
                      <span style={{
                        fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                        background: 'var(--accent)', color: '#fff', letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}>now</span>
                    )}
                  </div>
                  {dateRange && (
                    <p style={{ fontSize: 11, color: 'rgba(226,232,240,0.45)', margin: 0, lineHeight: 1.3, marginTop: 1 }}>
                      {dateRange}
                    </p>
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
