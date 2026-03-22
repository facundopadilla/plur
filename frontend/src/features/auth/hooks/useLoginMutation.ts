import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/stores/auth.store'
import type { LoginRequest, LoginResponse } from '../types'

interface UserMeResponse {
  id: number
  email: string
  first_name: string
  last_name: string
}

export function useLoginMutation() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      apiClient.post<LoginResponse>('/auth/token', data).then((r) => r.data),
    onSuccess: async (data) => {
      setTokens(data.access_token)
      // Fetch user profile now that we have the token
      try {
        const res = await apiClient.get<UserMeResponse>('/auth/me')
        setUser(res.data)
      } catch {
        // Token is set, user profile fetch failed — non-critical
      }
    },
  })
}
