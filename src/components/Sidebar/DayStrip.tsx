import { addDays, startOfISOWeek, addWeeks } from 'date-fns'
import { useTaskStore }     from '../../store/taskStore'
import { useUIStore }       from '../../store/uiStore'
import { useWeekStore }     from '../../store/weekStore'
import { getTodayDayLabel } from '../../utils/weekUtils'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const
const SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri',
}

export function DayStrip() {
  const { tasks }        = useTaskStore()
  const { activeWeekId } = useUIStore()
  const { pages }        = useWeekStore()
  const today            = getTodayDayLabel()
  const page             = activeWeekId ? pages[activeWeekId] : null

  const dateNumbers: Record<string, number> = {}
  if (page) {
    const jan4      = new Date(page.year, 0, 4)
    const weekStart = addWeeks(startOfISOWeek(jan4), page.weekNumber - 1)
    DAYS.forEach((d, i) => {
      dateNumbers[d] = addDays(weekStart, i).getDate()
    })
  }

  const weekTasks = tasks.filter(t => t.weekId === activeWeekId)

  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const,
        letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 8,
      }}>
        {page ? `Week ${page.weekNumber}` : 'This week'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {DAYS.map(day => {
          const dayTasks = weekTasks.filter(t => t.dayLabel === day)
          const total    = dayTasks.length
          const done     = dayTasks.filter(t => t.status === 'done').length
          const isToday  = day === today

          return (
            <div key={day} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 10px', borderRadius: 8,
              background: isToday ? 'var(--accent-soft)' : 'transparent',
            }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const,
                letterSpacing: '0.05em', width: 28,
                color: isToday ? 'var(--accent)' : 'var(--ink-3)',
              }}>
                {SHORT[day]}
              </div>
              <div style={{
                fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, width: 20,
                color: isToday ? 'var(--accent)' : 'var(--ink)',
              }}>
                {dateNumbers[day] ?? ''}
              </div>
              <div style={{
                flex: 1, height: 4, background: 'var(--rule)', borderRadius: 999, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: total === 0 ? '0%' : `${Math.round(done / total * 100)}%`,
                  background: 'var(--accent)', borderRadius: 999,
                }} />
              </div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 10,
                color: isToday ? 'var(--accent)' : 'var(--ink-4)',
                minWidth: 28, textAlign: 'right' as const,
              }}>
                {done}/{total}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
