import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { Range } from '@tiptap/core'

export interface SlashMenuItem {
  title: string
  description: string
  command: (props: { editor: Editor; range: Range }) => void
}

interface SlashMenuProps {
  items: SlashMenuItem[]
  command: (item: SlashMenuItem) => void
}

export const SlashMenu = forwardRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => setSelectedIndex(0), [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i - 1 + items.length) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          if (items[selectedIndex]) command(items[selectedIndex])
          return true
        }
        return false
      },
    }))

    if (!items.length) return null

    return (
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        padding: '4px 0',
        minWidth: 220,
        maxHeight: 320,
        overflowY: 'auto',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {items.map((item, i) => (
          <button
            key={item.title}
            onClick={() => command(item)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              textAlign: 'left',
              padding: '8px 14px',
              background: i === selectedIndex ? '#eef2ff' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              gap: 2,
              transition: 'background 0.1s',
            }}
            onMouseEnter={() => setSelectedIndex(i)}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{item.title}</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{item.description}</span>
          </button>
        ))}
      </div>
    )
  }
)

SlashMenu.displayName = 'SlashMenu'
