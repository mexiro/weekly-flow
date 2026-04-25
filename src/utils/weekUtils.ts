import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, format, addWeeks, addDays } from 'date-fns'
import type { JSONContent } from '@tiptap/react'
import type { WeeklyPage, Task } from '../types'

export function getWeekId(date: Date): string {
  const week = getISOWeek(date)
  const year = getISOWeekYear(date)
  return `CW${week}-${year}`
}

export function getWeekTitle(weekNumber: number, year: number): string {
  // Reconstruct week start from week number + year
  const jan4 = new Date(year, 0, 4)
  const startOfYear = startOfISOWeek(jan4)
  const weekStart = addWeeks(startOfYear, weekNumber - 1)
  const weekEnd = endOfISOWeek(weekStart)
  return `Week ${weekNumber} · ${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`
}

export function getWeekDateRange(weekNumber: number, year: number): { start: Date; end: Date } {
  const jan4 = new Date(year, 0, 4)
  const startOfYear = startOfISOWeek(jan4)
  const start = addWeeks(startOfYear, weekNumber - 1)
  const end = endOfISOWeek(start)
  return { start, end }
}

export function getNextWeek(weekNumber: number, year: number): { weekNumber: number; year: number } {
  const jan4 = new Date(year, 0, 4)
  const weekStart = addWeeks(startOfISOWeek(jan4), weekNumber - 1)
  const nextWeekDate = addDays(weekStart, 7)
  return {
    weekNumber: getISOWeek(nextWeekDate),
    year: getISOWeekYear(nextWeekDate),
  }
}

export function getCurrentWeekNumber(): number {
  return getISOWeek(new Date())
}

export function getCurrentYear(): number {
  return getISOWeekYear(new Date())
}

export function createDefaultContent(weekNumber: number, _year: number): JSONContent {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  const dayNodes: JSONContent[] = days.flatMap((day) => [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: day }],
    },
    {
      type: 'paragraph',
      content: [],
    },
  ])

  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: `🎯 Week ${weekNumber} — Goals` }],
      },
      { type: 'paragraph', content: [] },
      ...dayNodes,
    ],
  }
}

/** Count all taskItem nodes in a page's Tiptap JSON (recursive). */
export function countTaskItemsInPage(page: WeeklyPage): number {
  let n = 0
  const walk = (node: any) => {
    if (!node) return
    if (node.type === 'taskItem') n++
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }
  walk(page.content)
  return n
}

/** Consecutive ISO weeks (ending at current week) that have ≥1 taskItem. */
export function computeWritingStreak(pages: Record<string, WeeklyPage>): number {
  const now = new Date()
  let wn = getISOWeek(now)
  let yr = getISOWeekYear(now)
  const active = Object.values(pages).filter(p => countTaskItemsInPage(p) > 0)
  let streak = 0
  for (;;) {
    if (!active.find(p => p.weekNumber === wn && p.year === yr)) break
    streak++
    const weekStart = addWeeks(startOfISOWeek(new Date(yr, 0, 4)), wn - 1)
    const prev = addDays(weekStart, -7)
    wn = getISOWeek(prev)
    yr = getISOWeekYear(prev)
  }
  return streak
}

/** done / total / pct for a given weekId from the task store snapshot. */
export function weekProgress(tasks: Task[], weekId: string): { done: number; total: number; pct: number } {
  const w = tasks.filter(t => t.weekId === weekId)
  const total = w.length
  const done  = w.filter(t => t.status === 'done').length
  return { done, total, pct: total === 0 ? 0 : done / total }
}

/** "Monday" … "Sunday" for today in local time. */
export function getTodayDayLabel(): string {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]
}

/**
 * Clone all content from a source page, or roll over only unchecked taskItems.
 * In rollover mode: taskItem nodes with checked=true are dropped; paragraphs/headings kept.
 */
export function rolloverContent(source: JSONContent, mode: 'clone' | 'rollover'): JSONContent {
  if (mode === 'clone') return JSON.parse(JSON.stringify(source))

  function filterNode(node: JSONContent): JSONContent | null {
    if (node.type === 'taskItem') {
      if (node.attrs?.checked) return null
      return { ...node, content: node.content?.map(filterNode).filter(Boolean) as JSONContent[] }
    }
    if (node.type === 'taskList') {
      const kept = node.content?.map(filterNode).filter(Boolean) as JSONContent[]
      if (!kept || kept.length === 0) return null
      return { ...node, content: kept }
    }
    if (node.content) {
      return { ...node, content: node.content.map(filterNode).filter(Boolean) as JSONContent[] }
    }
    return node
  }

  const filtered = filterNode(source)
  return filtered ?? { type: 'doc', content: [] }
}

export function createWeekPage(weekNumber: number, year: number): WeeklyPage {
  const id = `CW${weekNumber}-${year}`
  return {
    id,
    weekNumber,
    year,
    icon: '📅',
    title: getWeekTitle(weekNumber, year),
    content: createDefaultContent(weekNumber, year),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
