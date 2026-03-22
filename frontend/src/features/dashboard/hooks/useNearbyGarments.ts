import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { DashboardGarment } from '../types'

export interface GarmentFilters {
  style?: string
  size?: string
  condition?: string
  gender?: string
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface NearbyGarment extends DashboardGarment {
  distance_km?: number
}

interface UseNearbyGarmentsParams {
  filters?: GarmentFilters
  coords?: Coordinates | null
  enabled?: boolean
}

export function useNearbyGarments({ filters, coords, enabled = true }: UseNearbyGarmentsParams = {}) {
  return useQuery({
    queryKey: ['nearby-garments', filters, coords],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (coords) {
        params.append('lat', coords.lat.toString())
        params.append('lng', coords.lng.toString())
        params.append('radius_km', '50')
      }

      if (filters?.style) params.append('style', filters.style)
      if (filters?.size) params.append('size', filters.size)
      if (filters?.condition) params.append('condition', filters.condition)
      if (filters?.gender) params.append('gender', filters.gender)

      const response = await apiClient.get<NearbyGarment[]>('/sales/garments/nearby', { params })
      return response.data
    },
    enabled,
  })
}
