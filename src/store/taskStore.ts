import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { JSONContent } from '@tiptap/react'
import type { Task, TaskOccurrence } from '../types'
import { extractRawTasks } from '../utils/taskParser'
import { normalizeTitle, nanoid } from '../utils/taskIdentity'

interface TaskState {
  tasks: Task[]
  /** Full reconcile: walk all pages, merge against persisted tasks. Call on any editor save. */
  reconcileTasks: (pages: Record<string, { content: JSONContent }>) => void
  /** Update status of a single task (called from Kanban drag). */
  updateTaskStatus: (id: string, status: Task['status']) => void
}

/**
 * Reconcile raw items from all pages against the existing persisted task list.
 *
 * Matching priority:
 *   1. Exact ID match (same nanoid seen before) — reuse, update occurrence list + checked state
 *   2. Normalized title match on a still-active task — reuse, append new occurrence
 *   3. No match → create new task with a fresh nanoid
 *
 * Tasks that no longer appear in any page are pruned unless they are 'doing' (manually set).
 */
function reconcile(
  existing: Task[],
  pages: Record<string, { content: JSONContent }>
): Task[] {
  // Collect all raw items from every page
  const allRaw = Object.entries(pages).flatMap(([weekId, page]) =>
    extractRawTasks(page.content, weekId)
  )

  // Group raw items by normalized title to detect cross-week recurrences
  const byNorm = new Map<string, typeof allRaw>()
  for (const raw of allRaw) {
    const key = normalizeTitle(raw.title)
    if (!byNorm.has(key)) byNorm.set(key, [])
    byNorm.get(key)!.push(raw)
  }

  // Index existing tasks by normalized title for fast lookup
  const existingByNorm = new Map<string, Task>()
  for (const t of existing) {
    existingByNorm.set(normalizeTitle(t.title), t)
  }

  const result: Task[] = []
  const seenNorm = new Set<string>()

  for (const [norm, raws] of byNorm) {
    seenNorm.add(norm)

    // Build de-duped occurrence list (unique weekId+dayLabel pairs)
    const occurrenceMap = new Map<string, TaskOccurrence>()
    for (const r of raws) {
      const key = `${r.weekId}::${r.dayLabel}`
      if (!occurrenceMap.has(key)) occurrenceMap.set(key, { weekId: r.weekId, dayLabel: r.dayLabel })
    }
    const occurrences = Array.from(occurrenceMap.values())

    // Most recent occurrence = last page by weekId lexicographic order (CW14-2026 > CW4-2026)
    const sorted = [...raws].sort((a, b) => b.weekId.localeCompare(a.weekId))
    const latest = sorted[0]
    const earliest = sorted[sorted.length - 1]

    // Determine checked state: done if latest occurrence is checked
    const checkedInLatest = latest.checked
    const checkedInAny = raws.some((r) => r.checked)

    const existing_ = existingByNorm.get(norm)

    if (existing_) {
      // Reuse existing task — preserve manually set 'doing' status
      let status: Task['status']
      if (existing_.status === 'doing') {
        status = 'doing'
      } else {
        status = checkedInLatest ? 'done' : 'todo'
      }

      result.push({
        ...existing_,
        title: latest.title,           // use most recent spelling
        status,
        weekId: latest.weekId,
        dayLabel: latest.dayLabel,
        occurrences,
        completedAt: status === 'done' && !existing_.completedAt
          ? new Date().toISOString()
          : status !== 'done'
          ? undefined
          : existing_.completedAt,
        lastUpdated: new Date().toISOString(),
      })
    } else {
      // New task
      result.push({
        id: nanoid(),
        title: latest.title,
        status: checkedInLatest ? 'done' : 'todo',
        originWeekId: earliest.weekId,
        weekId: latest.weekId,
        dayLabel: latest.dayLabel,
        occurrences,
        note: '',
        createdAt: new Date().toISOString(),
        completedAt: checkedInAny ? new Date().toISOString() : undefined,
        lastUpdated: new Date().toISOString(),
      })
    }
  }

  // Keep 'doing' tasks that were manually promoted even if not in any page right now
  for (const t of existing) {
    if (t.status === 'doing' && !seenNorm.has(normalizeTitle(t.title))) {
      result.push(t)
    }
  }

  return result
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],

      reconcileTasks: (pages) => {
        const next = reconcile(get().tasks, pages)
        set({ tasks: next })
      },

      updateTaskStatus: (id, status) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  completedAt: status === 'done' ? (t.completedAt ?? new Date().toISOString()) : undefined,
                  lastUpdated: new Date().toISOString(),
                }
              : t
          ),
        })),
    }),
    { name: 'weeklyflow:tasks' }
  )
)
