interface Props { pct: number; size?: number }

export function ProgressRing({ pct, size = 56 }: Props) {
  const r   = (size - 8) / 2
  const c   = 2 * Math.PI * r
  const off = c * (1 - Math.min(1, Math.max(0, pct)))
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--rule)" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth={4}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--display)', fontWeight: 600, fontSize: Math.round(size * 0.25),
        color: 'var(--ink)',
      }}>
        {Math.round(pct * 100)}%
      </div>
    </div>
  )
}
