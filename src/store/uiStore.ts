import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActiveView } from '../types'

interface UIState {
  activeWeekId: string | null
  activeView: ActiveView
  setActiveWeekId: (id: string) => void
  setActiveView: (view: ActiveView) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeWeekId: null,
      activeView: 'editor',
      setActiveWeekId: (id) => set({ activeWeekId: id }),
      setActiveView: (view) => set({ activeView: view }),
    }),
    {
      name: 'weeklyflow:ui',
    }
  )
)
