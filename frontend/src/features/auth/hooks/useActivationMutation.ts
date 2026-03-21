import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { ActivationRequest, ActivationResponse } from '../types'

export function useActivationMutation() {
  return useMutation({
    mutationFn: (data: ActivationRequest) =>
      apiClient
        .post<ActivationResponse>('/auth/activate', data)
        .then((r) => r.data),
  })
}
