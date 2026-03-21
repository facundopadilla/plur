import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { SignupRequest, SignupResponse } from '../types'

export function useSignupMutation() {
  return useMutation({
    mutationFn: (data: SignupRequest) => {
      const formData = new FormData()
      formData.append('email', data.email)
      formData.append('password', data.password)
      formData.append('first_name', data.first_name)
      formData.append('last_name', data.last_name)
      formData.append('date_of_birth', data.date_of_birth)
      formData.append('phone_number', data.phone_number)
      if (data.profile_picture) {
        formData.append('profile_picture', data.profile_picture)
      }
      return apiClient
        .post<SignupResponse>('/auth/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
  })
}
