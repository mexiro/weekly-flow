import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, ProjectTask } from '../types'

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function computeStatus(project: Project): Pick<Project, 'status' | 'completedAt'> {
  if (project.status === 'archived') return { status: 'archived', completedAt: project.completedAt }
  if (project.tasks.length > 0 && project.tasks.every((t) => t.done)) {
    return { status: 'completed', completedAt: project.completedAt ?? new Date().toISOString() }
  }
  return { status: 'active', completedAt: undefined }
}

interface ProjectState {
  projects: Record<string, Project>
  addProject: (title?: string) => Project
  updateProjectTitle: (id: string, title: string) => void
  updateProjectAssignee: (id: string, assignee: string) => void
  deleteProject: (id: string) => void
  archiveProject: (id: string) => void
  unarchiveProject: (id: string) => void
  addTask: (projectId: string, text: string) => void
  toggleTask: (projectId: string, taskId: string) => void
  updateTaskText: (projectId: string, taskId: string, text: string) => void
  deleteTask: (projectId: string, taskId: string) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: {},

      addProject: (title = 'New Project') => {
        const project: Project = {
          id: nanoid(),
          title,
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
        }
        set((state) => ({ projects: { ...state.projects, [project.id]: project } }))
        return project
      },

      updateProjectTitle: (id, title) =>
        set((state) => ({
          projects: {
            ...state.projects,
            [id]: { ...state.projects[id], title, updatedAt: new Date().toISOString() },
          },
        })),

      updateProjectAssignee: (id, assignee) =>
        set((state) => ({
          projects: {
            ...state.projects,
            [id]: { ...state.projects[id], assignee: assignee.trim() || undefined, updatedAt: new Date().toISOString() },
          },
        })),

      deleteProject: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.projects
          return { projects: rest }
        }),

      archiveProject: (id) =>
        set((state) => {
          const project = state.projects[id]
          if (!project) return state
          return {
            projects: {
              ...state.projects,
              [id]: {
                ...project,
                status: 'archived',
                archivedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          }
        }),

      unarchiveProject: (id) =>
        set((state) => {
          const project = state.projects[id]
          if (!project) return state
          const { status, completedAt } = computeStatus({ ...project, status: 'active', archivedAt: undefined })
          return {
            projects: {
              ...state.projects,
              [id]: {
                ...project,
                status,
                completedAt,
                archivedAt: undefined,
                updatedAt: new Date().toISOString(),
              },
            },
          }
        }),

      addTask: (projectId, text) =>
        set((state) => {
          const project = state.projects[projectId]
          if (!project) return state
          const task: ProjectTask = { id: nanoid(), text, done: false }
          const updated: Project = {
            ...project,
            tasks: [...project.tasks, task],
            updatedAt: new Date().toISOString(),
          }
          // Adding a task to a completed project reverts it to active
          if (updated.status === 'completed') {
            updated.status = 'active'
            updated.completedAt = undefined
          }
          return { projects: { ...state.projects, [projectId]: updated } }
        }),

      toggleTask: (projectId, taskId) =>
        set((state) => {
          const project = state.projects[projectId]
          if (!project) return state
          const tasks = project.tasks.map((t) =>
            t.id === taskId ? { ...t, done: !t.done } : t
          )
          const updated: Project = { ...project, tasks, updatedAt: new Date().toISOString() }
          const { status, completedAt } = computeStatus(updated)
          updated.status = status
          updated.completedAt = completedAt
          return { projects: { ...state.projects, [projectId]: updated } }
        }),

      updateTaskText: (projectId, taskId, text) =>
        set((state) => {
          const project = state.projects[projectId]
          if (!project) return state
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                tasks: project.tasks.map((t) =>
                  t.id === taskId ? { ...t, text } : t
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          }
        }),

      deleteTask: (projectId, taskId) =>
        set((state) => {
          const project = state.projects[projectId]
          if (!project) return state
          const tasks = project.tasks.filter((t) => t.id !== taskId)
          const updated: Project = { ...project, tasks, updatedAt: new Date().toISOString() }
          // Recompute status after deletion
          const { status, completedAt } = computeStatus(updated)
          updated.status = status
          updated.completedAt = completedAt
          return { projects: { ...state.projects, [projectId]: updated } }
        }),
    }),
    {
      name: 'weeklyflow:projects',
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          // Backfill status field for existing projects
          const projects = persisted.projects ?? {}
          const migrated: Record<string, Project> = {}
          for (const [id, p] of Object.entries(projects) as [string, any][]) {
            migrated[id] = { ...p, status: p.status ?? 'active' }
          }
          return { ...persisted, projects: migrated }
        }
        return persisted
      },
    }
  )
)
