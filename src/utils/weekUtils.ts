import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, format, addWeeks, addDays } from 'date-fns'
import type { JSONContent } from '@tiptap/react'
import type { WeeklyPage } from '../types'

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
