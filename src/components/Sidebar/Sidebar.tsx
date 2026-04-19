import { useUIStore }      from '../../store/uiStore'
import { SidebarHero }     from './SidebarHero'
import { DayStrip }        from './DayStrip'
import { WeekList }        from './WeekList'
import { ProjectsSummary } from './ProjectsSummary'
import { ViewSwitcher }    from './ViewSwitcher'
import { DemoControls }    from './DemoControls'

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  if (sidebarCollapsed) {
    return (
      <aside style={{
        width: 56, minWidth: 56, height: '100vh',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, var(--paper-2) 0%, #eae3d2 100%)',
        borderRight: '1px solid var(--rule)',
        overflow: 'hidden',
        transition: 'width 180ms ease',
        alignItems: 'center',
      }}>
        {/* Brand icon */}
        <div style={{ paddingTop: 16, flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: '#fff',
          }}>W</div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Expand button */}
        <button
          onClick={toggleSidebar}
          title="Expand sidebar"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 0 16px',
            fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          »
        </button>
      </aside>
    )
  }

  return (
    <aside style={{
      width: 280, minWidth: 280, height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, var(--paper-2) 0%, #eae3d2 100%)',
      borderRight: '1px solid var(--rule)',
      overflow: 'hidden',
      transition: 'width 180ms ease',
      fontFamily: 'var(--sans)',
    }}>
      {/* Brand row */}
      <div style={{
        padding: '18px 18px 12px', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: '#fff',
          flexShrink: 0,
        }}>W</div>
        <div style={{
          fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16, color: 'var(--ink)',
        }}>
          WeeklyFlow<span style={{ color: 'var(--accent)' }}>.</span>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'default',
        }}>⌘K</span>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', gap: 16,
        padding: '0 14px', overflowY: 'auto', minHeight: 0,
      }}>
        <SidebarHero />
        <DayStrip />
        <WeekList />
        <ProjectsSummary />
        <div style={{ flexShrink: 0, height: 8 }} />
      </div>

      {/* Footer */}
      <div style={{
        padding: '6px 18px 8px', flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)',
        textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7,
      }}>
        <span>Local · no sync</span>
        <button
          onClick={toggleSidebar}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}
        >
          « collapse
        </button>
      </div>

      <DemoControls />
      <ViewSwitcher />
    </aside>
  )
}
