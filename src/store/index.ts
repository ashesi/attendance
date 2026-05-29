import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '../types'

interface AppStore {
  role: Role | null
  userId: string | null
  userName: string | null
  token: string | null
  setRole: (role: Role, userId: string, userName: string, token: string) => void
  setToken: (token: string) => void
  logout: () => void

  // Faculty session creation
  activeSessionId: string | null
  setActiveSession: (id: string | null) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      role: null,
      userId: null,
      userName: null,
      token: null,
      setRole: (role, userId, userName, token) => set({ role, userId, userName, token }),
      setToken: (token) => set({ token }),
      logout: () => set({ role: null, userId: null, userName: null, token: null }),

      activeSessionId: null,
      setActiveSession: (id) => set({ activeSessionId: id }),
    }),
    {
      name: 'ashesi-app',
      partialize: (state) => ({
        role: state.role,
        userId: state.userId,
        userName: state.userName,
        token: state.token,
      }),
    },
  ),
)
