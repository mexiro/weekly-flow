import { useUIStore } from '../../store/uiStore'
import type { ActiveView } from '../../types'

export function ViewSwitcher() {
  const { activeView, setActiveView } = useUIStore()

  const tabs: { label: string; value: ActiveView; icon: string }[] = [
    { label: 'Editor', value: 'editor', icon: '✏️' },
    { label: 'Kanban', value: 'kanban', icon: '▦' },
  ]

  return (
    <div style={{
      padding: '12px 12px 16px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(226,232,240,0.4)', margin: 0 }}>
          View
        </p>
        <span style={{ fontSize: 10, color: 'rgba(226,232,240,0.25)' }}>⌘K</span>
      </div>
      <div style={{
        display: 'flex', gap: 4, padding: 4, borderRadius: 10,
        background: 'rgba(255,255,255,0.06)',
      }}>
        {tabs.map((tab) => {
          const isActive = activeView === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveView(tab.value)}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '6px 4px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(226,232,240,0.6)',
                transition: 'all 0.15s',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
