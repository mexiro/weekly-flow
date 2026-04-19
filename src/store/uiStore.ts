import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActiveView } from '../types'

interface UIState {
  activeWeekId: string | null
  activeView: ActiveView
  sidebarCollapsed: boolean
  setActiveWeekId: (id: string) => void
  setActiveView: (view: ActiveView) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeWeekId: null,
      activeView: 'editor',
      sidebarCollapsed: false,
      setActiveWeekId: (id) => set({ activeWeekId: id }),
      setActiveView: (view) => set({ activeView: view }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'weeklyflow:ui',
    }
  )
)
