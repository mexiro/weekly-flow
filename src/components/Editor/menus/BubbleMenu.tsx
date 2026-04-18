import { useState, useEffect, useRef, useCallback } from 'react'
import type { Editor } from '@tiptap/react'

interface BubbleMenuProps {
  editor: Editor
}

interface MenuPosition {
  top: number
  left: number
}

export function BubbleMenu({ editor }: BubbleMenuProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState<MenuPosition>({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    const { from, to } = editor.state.selection
    if (from === to || editor.isActive('codeBlock')) {
      setVisible(false)
      return
    }

    const start = editor.view.coordsAtPos(from)
    const end = editor.view.coordsAtPos(to)
    const menuWidth = menuRef.current?.offsetWidth ?? 280
    const centerX = (start.left + end.left) / 2
    const left = Math.max(8, centerX - menuWidth / 2)
    const top = start.top - (menuRef.current?.offsetHeight ?? 40) - 8 + window.scrollY

    setPos({ top, left })
    setVisible(true)
  }, [editor])

  useEffect(() => {
    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection
      if (from === to) {
        setVisible(false)
      } else {
        // Small delay so coords are stable
        requestAnimationFrame(updatePosition)
      }
    }

    editor.on('selectionUpdate', handleSelectionUpdate)
    editor.on('blur', () => setVisible(false))

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor, updatePosition])

  if (!visible) return <div ref={menuRef} style={{ position: 'fixed', visibility: 'hidden', top: 0, left: 0 }} />

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 50,
        background: '#1a1a2e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      }}
    >
      <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
        <strong>B</strong>
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
        <em>I</em>
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strike">
        <s>S</s>
      </MenuButton>
      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
      <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="H1">
        H1
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="H2">
        H2
      </MenuButton>
      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
      <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Code">
        {'<>'}
      </MenuButton>
    </div>
  )
}

function MenuButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void
  isActive: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      style={{
        padding: '4px 8px',
        borderRadius: 5,
        fontSize: 12,
        fontWeight: 500,
        minWidth: 28,
        textAlign: 'center',
        color: isActive ? '#fff' : 'rgba(226,232,240,0.75)',
        background: isActive ? 'var(--accent)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.1s',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {children}
    </button>
  )
}
