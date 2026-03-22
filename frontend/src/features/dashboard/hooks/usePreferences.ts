import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export interface UserPreferences {
  styles: string[]
  sizes: string[]
  colors: string[]
  conditions: string[]
  genders: string[]
  discovery_radius_km: number
  proximity_enabled: boolean
}

const PREFERENCES_QUERY_KEY = ['user-preferences']

export function usePreferences() {
  return useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: async (): Promise<UserPreferences> => {
      const response = await apiClient.get<UserPreferences>('/auth/me/preferences')
      return response.data
    },
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<UserPreferences>): Promise<UserPreferences> => {
      const response = await apiClient.put<UserPreferences>('/auth/me/preferences', data)
      return response.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY })
    },
  })
}
