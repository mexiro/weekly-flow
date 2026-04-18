import type { JSONContent } from '@tiptap/react'

export interface WeeklyPage {
  id: string          // "CW14-2026"
  weekNumber: number  // 14
  year: number        // 2026
  icon: string        // emoji
  title: string       // "Week 14 · Mar 30 – Apr 3"
  content: JSONContent
  createdAt: string
  updatedAt: string
}

export interface TaskOccurrence {
  weekId: string
  dayLabel: string
}

export interface Task {
  id: string                    // stable nanoid (not a hash)
  title: string
  status: 'todo' | 'doing' | 'done'
  originWeekId: string          // first week this task appeared
  weekId: string                // most recent occurrence week (for editor sync)
  dayLabel: string              // most recent occurrence day (for editor sync)
  occurrences: TaskOccurrence[] // all (weekId, dayLabel) pairs across editor
  note: string
  createdAt: string
  completedAt?: string
  lastUpdated: string
}

export type ActiveView = 'editor' | 'kanban'

export interface ProjectTask {
  id: string        // nanoid
  text: string
  done: boolean
  note?: string
}

export interface Project {
  id: string        // nanoid
  title: string
  assignee?: string
  tasks: ProjectTask[]
  createdAt: string
  updatedAt: string
  completedAt?: string
  archivedAt?: string
  status: 'active' | 'completed' | 'archived'
}

export type KanbanTab = 'week' | 'projects'
