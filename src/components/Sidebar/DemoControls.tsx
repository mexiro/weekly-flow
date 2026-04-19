import { useState } from 'react'
import { seedSampleData, clearAllData } from '../../utils/sampleData'

export function DemoControls() {
  const [seeded, setSeeded] = useState(false)

  function handleSeed() {
    seedSampleData()
    setSeeded(true)
  }

  function handleClear() {
    if (window.confirm('Clear all data? This cannot be undone.')) {
      clearAllData()
      setSeeded(false)
    }
  }

  return (
    <div style={{
      padding: '8px 14px 10px',
      borderTop: '1px solid var(--rule-2)',
      display: 'flex', gap: 6, alignItems: 'center',
    }}>
      <button
        onClick={handleSeed}
        title="Load sample weeks, tasks and projects"
        style={{
          flex: 1,
          padding: '5px 0',
          borderRadius: 6,
          border: '1px solid var(--rule)',
          background: seeded ? 'var(--accent-soft)' : '#fffcf3',
          color: seeded ? 'var(--accent)' : 'var(--ink-3)',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {seeded ? '✓ demo loaded' : '+ load demo'}
      </button>
      <button
        onClick={handleClear}
        title="Clear all data"
        style={{
          padding: '5px 8px',
          borderRadius: 6,
          border: '1px solid var(--rule)',
          background: 'transparent',
          color: 'var(--ink-4)',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
      >
        ✕
      </button>
    </div>
  )
}
