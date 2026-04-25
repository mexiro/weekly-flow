import { useEffect, useState } from 'react'
import { AppLayout } from './components/Layout/AppLayout'
import { WeeklyEditor } from './components/Editor/WeeklyEditor'
import { KanbanBoard } from './components/Kanban/KanbanBoard'
import { useWeekStore } from './store/weekStore'
import { useProjectStore } from './store/projectStore'
import { useUIStore } from './store/uiStore'
import { createWeekPage, getCurrentWeekNumber, getCurrentYear } from './utils/weekUtils'
import {
  pullSnapshot, applySnapshot, isSyncConfigured, schedulePush,
} from './sync/cloudSync'

function App() {
  const { pages, addPage } = useWeekStore()
  const { activeWeekId, setActiveWeekId, activeView, setActiveView } = useUIStore()
  const [syncState, setSyncState] = useState<'idle' | 'pulling' | 'ready' | 'error'>('idle')

  // Pull from cloud on startup, then auto-create current week if needed
  useEffect(() => {
    if (!isSyncConfigured()) {
      setSyncState('ready')
      return
    }
    setSyncState('pulling')
    pullSnapshot()
      .then(remote => {
        if (remote) {
          const localPages = useWeekStore.getState().pages
          const localMax = Object.values(localPages).reduce(
            (max, p) => (p.updatedAt > max ? p.updatedAt : max),
            ''
          )
          if (remote.updatedAt > localMax) {
            applySnapshot(remote)
          }
        }
        setSyncState('ready')
      })
      .catch(err => {
        console.error('[sync] pull error:', err)
        setSyncState('error')
      })
  }, [])

  // Auto-create current week once sync is settled
  useEffect(() => {
    if (syncState === 'idle' || syncState === 'pulling') return
    const weekNumber = getCurrentWeekNumber()
    const year = getCurrentYear()
    const id = `CW${weekNumber}-${year}`
    const currentPages = useWeekStore.getState().pages

    if (!currentPages[id]) {
      const page = createWeekPage(weekNumber, year)
      addPage(page)
      setActiveWeekId(page.id)
    } else if (!activeWeekId) {
      setActiveWeekId(id)
    }
  }, [syncState])

  // Subscribe to store changes and push to cloud (debounced 3s)
  useEffect(() => {
    if (syncState !== 'ready' || !isSyncConfigured()) return
    const unsubA = useWeekStore.subscribe(schedulePush)
    const unsubB = useProjectStore.subscribe(schedulePush)
    return () => { unsubA(); unsubB() }
  }, [syncState])

  // Cmd/Ctrl+K toggles between editor and kanban
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setActiveView(activeView === 'editor' ? 'kanban' : 'editor')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeView, setActiveView])

  if (syncState === 'pulling') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 12,
        background: 'var(--paper)', color: 'var(--ink-3)', fontFamily: 'var(--sans)',
      }}>
        <span style={{ fontSize: 14 }}>Syncing…</span>
      </div>
    )
  }

  const activePage = activeWeekId ? pages[activeWeekId] : null

  return (
    <AppLayout>
      {activePage ? (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
          {/* Editor view */}
          <div style={{
            position: 'absolute', inset: 0,
            opacity: activeView === 'editor' ? 1 : 0,
            pointerEvents: activeView === 'editor' ? 'auto' : 'none',
            transition: 'opacity 0.18s ease',
          }}>
            <WeeklyEditor key={activePage.id} page={activePage} />
          </div>

          {/* Kanban view */}
          <div style={{
            position: 'absolute', inset: 0,
            opacity: activeView === 'kanban' ? 1 : 0,
            pointerEvents: activeView === 'kanban' ? 'auto' : 'none',
            transition: 'opacity 0.18s ease',
          }}>
            <KanbanBoard />
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', flexDirection: 'column', gap: 12,
          color: 'var(--text-secondary)',
        }}>
          <span style={{ fontSize: 40 }}>📅</span>
          <p style={{ fontSize: 14, margin: 0 }}>No week selected</p>
          <p style={{ fontSize: 12, margin: 0, color: '#d1d5db' }}>Click "+ New" in the sidebar to get started</p>
        </div>
      )}
    </AppLayout>
  )
}

export default App
