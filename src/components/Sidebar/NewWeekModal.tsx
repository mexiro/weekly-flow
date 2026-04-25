import { useState, useEffect, useRef } from 'react'
import { createWeekPage, getWeekTitle, getCurrentWeekNumber, getCurrentYear, getNextWeek, rolloverContent } from '../../utils/weekUtils'
import { useWeekStore } from '../../store/weekStore'
import { useUIStore } from '../../store/uiStore'
import { useTaskStore } from '../../store/taskStore'
import type { WeeklyPage } from '../../types'

interface NewWeekModalProps {
  onClose: () => void
}

function buildSuggestions(pages: Record<string, WeeklyPage>): { weekNumber: number; year: number; label: string }[] {
  const currentWeek = getCurrentWeekNumber()
  const currentYear = getCurrentYear()
  const suggestions = []

  // Suggest current week + next 4 weeks
  let wn = currentWeek
  let yr = currentYear
  for (let i = 0; i < 5; i++) {
    const id = `CW${wn}-${yr}`
    if (!pages[id]) {
      suggestions.push({ weekNumber: wn, year: yr, label: `CW${wn} · ${getWeekTitle(wn, yr).split('·')[1]?.trim()}` })
    }
    const next = getNextWeek(wn, yr)
    wn = next.weekNumber
    yr = next.year
  }

  return suggestions
}

export function NewWeekModal({ onClose }: NewWeekModalProps) {
  const { pages, addPage } = useWeekStore()
  const { setActiveWeekId } = useUIStore()
  const { reconcileTasks } = useTaskStore()
  const [tab, setTab] = useState<'pick' | 'manual' | 'rollover'>('pick')
  const [manualWeek, setManualWeek] = useState('')
  const [manualYear, setManualYear] = useState(String(getCurrentYear()))
  const [rolloverMode, setRolloverMode] = useState<'clone' | 'rollover'>('rollover')
  const [rolloverSourceId, setRolloverSourceId] = useState<string>('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = buildSuggestions(pages)

  // Default rollover source: most recent existing page
  const sortedPages = Object.values(pages).sort((a, b) => b.weekNumber - a.weekNumber || b.year - a.year)
  useEffect(() => {
    if (tab === 'rollover' && !rolloverSourceId && sortedPages.length > 0) {
      setRolloverSourceId(sortedPages[0].id)
    }
  }, [tab])

  useEffect(() => {
    if (tab === 'manual') inputRef.current?.focus()
  }, [tab])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function createAndNavigate(weekNumber: number, year: number) {
    const id = `CW${weekNumber}-${year}`
    if (pages[id]) {
      setActiveWeekId(id)
    } else {
      const page = createWeekPage(weekNumber, year)
      addPage(page)
      setActiveWeekId(page.id)
    }
    onClose()
  }

  function handleRolloverCreate() {
    const source = pages[rolloverSourceId]
    if (!source) { setError('Select a source week'); return }

    // Find the next free week slot: scan forward from the week after source
    const next = (() => {
      let { weekNumber: wn, year: yr } = getNextWeek(source.weekNumber, source.year)
      for (let i = 0; i < 52; i++) {
        if (!pages[`CW${wn}-${yr}`]) return { weekNumber: wn, year: yr }
        const n = getNextWeek(wn, yr)
        wn = n.weekNumber
        yr = n.year
      }
      return null
    })()

    if (!next) {
      setError('No free week slot found in the next 52 weeks')
      return
    }

    const newId = `CW${next.weekNumber}-${next.year}`
    if (pages[newId]) {
      setError(`${newId} already exists — use Manual entry`)
      return
    }

    const content = rolloverContent(source.content, rolloverMode, next.weekNumber, next.year)
    const page = { ...createWeekPage(next.weekNumber, next.year), content }
    addPage(page)
    // Reconcile so carry-over tasks get occurrences updated
    setTimeout(() => reconcileTasks({ ...useWeekStore.getState().pages }), 0)
    setActiveWeekId(page.id)
    onClose()
  }

  function handleManualSubmit() {
    const wn = parseInt(manualWeek, 10)
    const yr = parseInt(manualYear, 10)
    if (!manualWeek || isNaN(wn) || wn < 1 || wn > 53) {
      setError('Enter a valid week number (1–53)')
      return
    }
    if (isNaN(yr) || yr < 2020 || yr > 2099) {
      setError('Enter a valid year')
      return
    }
    createAndNavigate(wn, yr)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', zIndex: 101,
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff',
        borderRadius: 14,
        padding: '24px',
        width: 360,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>
          Add a week
        </h2>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 18px' }}>
          Pick a suggested week or enter one manually
        </p>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, background: '#f3f4f6',
          borderRadius: 8, padding: 3, marginBottom: 18,
        }}>
          {([['pick', 'Suggestions'], ['manual', 'Manual'], ['rollover', 'From previous']] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 500,
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? '#1a1a1a' : '#6b7280',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Pick tab */}
        {tab === 'pick' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestions.length === 0 && (
              <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>
                All upcoming weeks already exist
              </p>
            )}
            {suggestions.map(s => (
              <button
                key={`${s.weekNumber}-${s.year}`}
                onClick={() => createAndNavigate(s.weekNumber, s.year)}
                style={{
                  textAlign: 'left', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer',
                  fontSize: 13, color: '#1a1a1a', fontFamily: "'Inter', system-ui, sans-serif",
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <span style={{ fontWeight: 600 }}>CW{s.weekNumber}</span>
                <span style={{ color: '#6b7280', marginLeft: 8, fontSize: 12 }}>
                  {getWeekTitle(s.weekNumber, s.year).split('·')[1]?.trim()}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Manual tab */}
        {tab === 'manual' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                  Week number
                </label>
                <input
                  ref={inputRef}
                  type="number"
                  min={1}
                  max={53}
                  placeholder="e.g. 20"
                  value={manualWeek}
                  onChange={e => { setManualWeek(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 7,
                    border: '1px solid #e5e7eb', fontSize: 13, outline: 'none',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                  Year
                </label>
                <input
                  type="number"
                  min={2020}
                  max={2099}
                  value={manualYear}
                  onChange={e => { setManualYear(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 7,
                    border: '1px solid #e5e7eb', fontSize: 13, outline: 'none',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            {error && (
              <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 8px' }}>{error}</p>
            )}
          </div>
        )}

        {/* Rollover tab */}
        {tab === 'rollover' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sortedPages.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>
                No existing weeks to copy from
              </p>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                    Copy from
                  </label>
                  <select
                    value={rolloverSourceId}
                    onChange={e => setRolloverSourceId(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 7,
                      border: '1px solid #e5e7eb', fontSize: 13, outline: 'none',
                      fontFamily: "'Inter', system-ui, sans-serif",
                      background: '#fff', cursor: 'pointer',
                    }}
                  >
                    {sortedPages.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 6 }}>
                    Mode
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {([
                      ['rollover', 'Roll over unchecked tasks', 'Copies all content, drops completed ✓ tasks'],
                      ['clone', 'Clone full content', 'Exact copy including completed tasks'],
                    ] as const).map(([mode, title, desc]) => (
                      <label
                        key={mode}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '10px 12px', borderRadius: 8,
                          border: `1px solid ${rolloverMode === mode ? 'var(--accent)' : '#e5e7eb'}`,
                          background: rolloverMode === mode ? 'var(--accent-soft, #e8e6fb)' : '#fff',
                          cursor: 'pointer', transition: 'all 0.12s',
                        }}
                      >
                        <input
                          type="radio"
                          name="rolloverMode"
                          value={mode}
                          checked={rolloverMode === mode}
                          onChange={() => setRolloverMode(mode)}
                          style={{ marginTop: 2, accentColor: 'var(--accent)' }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{title}</div>
                          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{error}</p>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 7, border: '1px solid #e5e7eb',
              background: '#fff', fontSize: 13, cursor: 'pointer', color: '#6b7280',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            Cancel
          </button>
          {tab === 'manual' && (
            <button
              onClick={handleManualSubmit}
              style={{
                padding: '8px 16px', borderRadius: 7, border: 'none',
                background: 'var(--accent)', color: '#fff',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              Create week
            </button>
          )}
          {tab === 'rollover' && sortedPages.length > 0 && (
            <button
              onClick={handleRolloverCreate}
              style={{
                padding: '8px 16px', borderRadius: 7, border: 'none',
                background: 'var(--accent)', color: '#fff',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              Create week
            </button>
          )}
        </div>
      </div>
    </>
  )
}
