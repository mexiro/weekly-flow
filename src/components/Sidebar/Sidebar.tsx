import { WeekList } from './WeekList'
import { ViewSwitcher } from './ViewSwitcher'

export function Sidebar() {
  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-sidebar)',
      color: 'var(--text-sidebar)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28,
            borderRadius: 8,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            W
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#fff', letterSpacing: '-0.3px' }}>
            WeeklyFlow
          </span>
        </div>
      </div>

      {/* Week list — fills remaining space */}
      <WeekList />

      {/* View switcher — pinned to bottom */}
      <ViewSwitcher />
    </aside>
  )
}
