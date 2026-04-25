import type { JSONContent } from '@tiptap/react'

const DAY_LABELS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export interface RawTaskItem {
  title: string
  checked: boolean
  weekId: string
  dayLabel: string
}

function getTextContent(node: JSONContent): string {
  if (node.text) return node.text
  if (node.content) return node.content.map(getTextContent).join('')
  return ''
}

function isDayHeading(text: string): string | null {
  const lower = text.toLowerCase().trim()
  // Recognize "Unassigned" / "📥 Unassigned" as a valid grouping label
  if (lower.includes('unassigned')) return 'Unassigned'
  const match = DAY_LABELS.find(day => lower === day || lower.startsWith(day))
  return match ? match.charAt(0).toUpperCase() + match.slice(1) : null
}

/** Extract raw task items from a single page's Tiptap JSON. No IDs assigned here. */
export function extractRawTasks(content: JSONContent, weekId: string): RawTaskItem[] {
  const items: RawTaskItem[] = []
  const nodes = content.content ?? []
  let currentDay = 'General'

  for (const node of nodes) {
    if (node.type === 'heading') {
      const text = getTextContent(node)
      const day = isDayHeading(text)
      if (day) currentDay = day
      continue
    }

    if (node.type === 'taskList') {
      for (const item of node.content ?? []) {
        if (item.type !== 'taskItem') continue
        const checked = item.attrs?.checked === true
        const title = getTextContent(item).trim()
        if (!title) continue
        items.push({ title, checked, weekId, dayLabel: currentDay })
      }
    }
  }

  return items
}
