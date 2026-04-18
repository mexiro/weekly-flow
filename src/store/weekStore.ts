import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { JSONContent } from '@tiptap/react'
import type { WeeklyPage } from '../types'

interface WeekState {
  pages: Record<string, WeeklyPage>
  addPage: (page: WeeklyPage) => void
  updatePageContent: (id: string, content: JSONContent) => void
  updatePageIcon: (id: string, icon: string) => void
  updatePageTitle: (id: string, title: string) => void
}

export const useWeekStore = create<WeekState>()(
  persist(
    (set) => ({
      pages: {},
      addPage: (page) =>
        set((state) => ({ pages: { ...state.pages, [page.id]: page } })),
      updatePageContent: (id, content) =>
        set((state) => ({
          pages: {
            ...state.pages,
            [id]: { ...state.pages[id], content, updatedAt: new Date().toISOString() },
          },
        })),
      updatePageIcon: (id, icon) =>
        set((state) => ({
          pages: { ...state.pages, [id]: { ...state.pages[id], icon } },
        })),
      updatePageTitle: (id, title) =>
        set((state) => ({
          pages: { ...state.pages, [id]: { ...state.pages[id], title } },
        })),
    }),
    {
      name: 'weeklyflow:pages',
    }
  )
)
