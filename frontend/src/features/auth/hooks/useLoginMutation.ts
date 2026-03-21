import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/stores/auth.store'
import type { LoginRequest, LoginResponse } from '../types'

export function useLoginMutation() {
  const setTokens = useAuthStore((s) => s.setTokens)

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      apiClient.post<LoginResponse>('/auth/token', data).then((r) => r.data),
    onSuccess: (data) => {
      setTokens(data.access_token)
    },
  })
}
