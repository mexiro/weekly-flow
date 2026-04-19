interface Props { weeks: number }

export function StreakPill({ weeks }: Props) {
  if (weeks === 0) return null
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px 3px 8px', borderRadius: 999,
      background: 'var(--ochre-soft)', border: '1px solid #e7d3ad',
      color: 'var(--ochre)',
      fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase' as const,
      letterSpacing: '0.06em', whiteSpace: 'nowrap' as const,
    }}>
      <span>🔥</span>
      <span>{weeks} {weeks === 1 ? 'week' : 'weeks'}</span>
    </div>
  )
}
