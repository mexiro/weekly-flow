import { useUIStore }    from '../../store/uiStore'
import type { ActiveView } from '../../types'

export function ViewSwitcher() {
  const { activeView, setActiveView } = useUIStore()

  const tabs: { label: string; value: ActiveView }[] = [
    { label: 'Editor', value: 'editor' },
    { label: 'Kanban', value: 'kanban' },
  ]

  return (
    <div style={{
      padding: '10px 12px 14px', borderTop: '1px solid var(--rule)',
      background: 'var(--paper-2)', flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', gap: 4, padding: 4, borderRadius: 10,
        background: '#fff', border: '1px solid var(--rule)',
      }}>
        {tabs.map(tab => {
          const active = activeView === tab.value
          return (
            <button key={tab.value} onClick={() => setActiveView(tab.value)} style={{
              flex: 1, padding: '6px 4px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? '#fff' : 'var(--ink-2)',
              transition: 'all 0.15s',
            }}>
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
