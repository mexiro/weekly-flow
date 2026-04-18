import { useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import { BubbleMenu } from './menus/BubbleMenu'
import { SlashCommand } from './extensions/SlashCommand'
import { useWeekStore } from '../../store/weekStore'
import { useTaskStore } from '../../store/taskStore'
import type { WeeklyPage } from '../../types'

interface WeeklyEditorProps {
  page: WeeklyPage
}

export function WeeklyEditor({ page }: WeeklyEditorProps) {
  const { updatePageContent, updatePageIcon, updatePageTitle, pages } = useWeekStore()
  const { reconcileTasks } = useTaskStore()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isExternalUpdate = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: false }),
      SlashCommand,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Heading…'
          return 'Start writing…'
        },
        includeChildren: true,
      }),
    ],
    content: page.content,
    onUpdate: ({ editor }) => {
      if (isExternalUpdate.current) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        const json = editor.getJSON()
        updatePageContent(page.id, json)
        // Reconcile after the store update lands — use a short trailing tick
        setTimeout(() => reconcileTasks({ ...pages, [page.id]: { content: json } }), 0)
      }, 500)
    },
    editorProps: {
      attributes: {
        class: 'weeklyflow-editor',
        spellcheck: 'true',
      },
    },
  })

  // Sync page.id change (switching weeks)
  useEffect(() => {
    if (editor && page.content) {
      isExternalUpdate.current = true
      editor.commands.setContent(page.content, { emitUpdate: false })
      isExternalUpdate.current = false
      reconcileTasks(pages)
    }
  }, [page.id])

  // Sync external content changes (e.g. Kanban writing back checked state)
  useEffect(() => {
    if (!editor) return
    const current = JSON.stringify(editor.getJSON())
    const incoming = JSON.stringify(page.content)
    if (current !== incoming) {
      isExternalUpdate.current = true
      editor.commands.setContent(page.content, { emitUpdate: false })
      isExternalUpdate.current = false
      reconcileTasks(pages)
    }
  }, [page.content])

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [])

  const handleIconClick = useCallback(() => {
    const emojis = ['📅', '🎯', '🚀', '💡', '🔥', '⚡', '🌱', '📝', '🎨', '🏆']
    const current = emojis.indexOf(page.icon)
    const next = emojis[(current + 1) % emojis.length]
    updatePageIcon(page.id, next)
  }, [page.id, page.icon, updatePageIcon])

  const dateRange = page.title.includes('·') ? page.title.split('·')[1]?.trim() : ''

  return (
    // Outer: fills the main panel, scrolls
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: '#fff' }}>
      {editor && <BubbleMenu editor={editor} />}

      {/* Centered column — like Notion */}
      <div style={{ padding: '56px 80px 120px 60px' }}>

        {/* Icon */}
        <button
          onClick={handleIconClick}
          title="Click to change icon"
          style={{
            fontSize: 40, lineHeight: 1, display: 'block', marginBottom: 12,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {page.icon}
        </button>

        {/* Editable title */}
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const val = e.currentTarget.textContent?.trim()
            if (val && val !== page.title) updatePageTitle(page.id, val)
          }}
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: 30, fontWeight: 700, lineHeight: 1.25,
            color: '#1a1a1a', outline: 'none', marginBottom: 6,
            wordBreak: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: page.title }}
        />

        {/* Date subtitle */}
        {dateRange && (
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>{dateRange}</p>
        )}

        {/* Divider */}
        <div style={{ borderTop: '1px solid #e5e7eb', marginBottom: 4 }} />

        {/* Tiptap content */}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
