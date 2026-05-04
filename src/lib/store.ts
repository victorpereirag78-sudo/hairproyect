import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewType =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'calendar'
  | 'clients'
  | 'client-detail'
  | 'services'
  | 'automations'
  | 'settings'

interface AppState {
  // Navigation
  currentView: ViewType
  setCurrentView: (view: ViewType) => void

  // Auth
  isAuthenticated: boolean
  user: {
    id: string
    email: string
    name: string
    role: string
    salonId: string | null
    salonName: string | null
  } | null
  setUser: (user: AppState['user']) => void
  login: (user: NonNullable<AppState['user']>) => void
  logout: () => void

  // Selected entities
  selectedClientId: string | null
  setSelectedClientId: (id: string | null) => void

  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  notificationsOpen: boolean
  setNotificationsOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Navigation
      currentView: 'landing',
      setCurrentView: (view) => set({ currentView: view }),

      // Auth
      isAuthenticated: false,
      user: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      login: (user) =>
        set({
          user,
          isAuthenticated: true,
          currentView: 'dashboard',
        }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          currentView: 'landing',
          selectedClientId: null,
        }),

      // Selected entities
      selectedClientId: null,
      setSelectedClientId: (id) => set({ selectedClientId: id }),

      // UI state
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      notificationsOpen: false,
      setNotificationsOpen: (open) => set({ notificationsOpen: open }),
    }),
    {
      name: 'glossy-crm-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        currentView: state.currentView,
      }),
    }
  )
)
