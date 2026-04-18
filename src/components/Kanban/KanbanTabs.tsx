import type { KanbanTab } from '../../types'

interface KanbanTabsProps {
  active: KanbanTab
  onChange: (tab: KanbanTab) => void
}

export function KanbanTabs({ active, onChange }: KanbanTabsProps) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
      <div style={{ display: 'flex', gap: 24, padding: '0 32px' }}>
        {(['week', 'projects'] as KanbanTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: active === tab ? '2px solid var(--accent)' : '2px solid transparent',
              padding: '14px 0 12px',
              cursor: 'pointer',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: active === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'color 0.15s',
              marginBottom: -1,
            }}
          >
            {tab === 'week' ? 'This Week' : 'Projects'}
          </button>
        ))}
      </div>
    </div>
  )
}
