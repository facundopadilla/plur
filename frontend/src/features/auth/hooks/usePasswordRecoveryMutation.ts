import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { PasswordResetRequest, PasswordResetResponse } from '../types'

export function usePasswordRecoveryMutation() {
  return useMutation({
    mutationFn: (data: PasswordResetRequest) =>
      apiClient
        .post<PasswordResetResponse>('/auth/password-reset', data)
        .then((r) => r.data),
  })
}
