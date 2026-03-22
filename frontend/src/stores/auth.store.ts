import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '@/api/client'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
}

interface AuthState {
  accessToken: string | null
  user: User | null
  setTokens: (access: string) => void
  setUser: (user: User) => void
  refresh: () => Promise<void>
  logout: () => void
}

interface RefreshResponse {
  access_token: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,

      setTokens: (access) => set({ accessToken: access }),

      setUser: (user) => set({ user }),

      refresh: async () => {
        const response = await apiClient.post<RefreshResponse>('/auth/refresh')
        set({ accessToken: response.data.access_token })
      },

      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    }
  )
)
