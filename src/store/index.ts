import { create } from 'zustand'
import type { Role } from '../types'

interface AppStore {
  role: Role | null
  userId: string | null
  userName: string | null
  setRole: (role: Role, userId: string, userName: string) => void
  logout: () => void

  // Faculty session creation
  activeSessionId: string | null
  setActiveSession: (id: string | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  role: null,
  userId: null,
  userName: null,
  setRole: (role, userId, userName) => set({ role, userId, userName }),
  logout: () => set({ role: null, userId: null, userName: null }),

  activeSessionId: null,
  setActiveSession: (id) => set({ activeSessionId: id }),
}))
