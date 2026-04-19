import { useWeekStore }  from '../../store/weekStore'
import { useTaskStore }  from '../../store/taskStore'
import { useUIStore }    from '../../store/uiStore'
import { weekProgress } from '../../utils/weekUtils'
import { ProgressRing }  from './ProgressRing'

export function SidebarHero() {
  const { pages }        = useWeekStore()
  const { tasks }        = useTaskStore()
  const { activeWeekId } = useUIStore()

  const page      = activeWeekId ? pages[activeWeekId] : null
  const progress  = page ? weekProgress(tasks, page.id) : { done: 0, total: 0, pct: 0 }
  const carryover = tasks.filter(t =>
    t.weekId === activeWeekId && t.occurrences.length > 1
  ).length

  return (
    <div style={{
      background: '#fffcf3', border: '1px solid var(--rule)', borderRadius: 12, padding: 16,
      flexShrink: 0,
    }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const,
        letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 10,
      }}>
        {page ? `This week · CW${page.weekNumber}` : 'This week'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ProgressRing pct={progress.pct} size={64} />
        <div>
          <div style={{
            fontFamily: 'var(--display)', fontWeight: 600, fontSize: 20, lineHeight: 1,
            color: 'var(--ink)',
          }}>
            {progress.done} / {progress.total}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, fontFamily: 'var(--sans)' }}>
            tasks done
          </div>
          <div style={{
            marginTop: 8, height: 4, width: 120,
            background: 'var(--rule)', borderRadius: 999, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${Math.round(progress.pct * 100)}%`,
              background: 'var(--accent)', borderRadius: 999,
            }} />
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 8, marginTop: 12,
        flexWrap: 'wrap' as const, alignItems: 'center',
      }}>
        {carryover > 0 && (
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const,
            letterSpacing: '0.05em', padding: '3px 8px', borderRadius: 999,
            background: 'var(--ochre-soft)', border: '1px solid #e7d3ad', color: 'var(--ochre)',
            whiteSpace: 'nowrap' as const,
          }}>
            {carryover} carry-over
          </div>
        )}
      </div>
    </div>
  )
}
