import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { GarmentOut, GarmentIn } from '@/api/generated/types.gen'
import type { DashboardGarment } from '../types'

export const MY_GARMENTS_QUERY_KEY = ['garments', 'mine'] as const
export const FEED_QUERY_KEY = ['garments', 'feed'] as const

function mapGarmentOutToDashboard(g: GarmentOut): DashboardGarment {
  return {
    id: String(g.id),
    name: g.name,
    description: g.description,
    images: g.images,
    pricePLR: g.price_plr,
    size: g.size,
    style: g.style,
    condition: g.condition,
    location: g.location,
    tags: g.tags,
    seller: {
      name: g.seller_name,
      avatarUrl: '',
      bio: '',
    },
  }
}

export function useGarmentFeed() {
  return useQuery<DashboardGarment[]>({
    queryKey: FEED_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<GarmentOut[]>('/sales/garments/feed')
      return res.data.map(mapGarmentOutToDashboard)
    },
  })
}

export function useMyGarments() {
  return useQuery<GarmentOut[]>({
    queryKey: MY_GARMENTS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<GarmentOut[]>('/sales/garments/mine')
      return res.data
    },
  })
}

export function usePublishGarment() {
  const queryClient = useQueryClient()
  return useMutation<GarmentOut, Error, GarmentIn>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<GarmentOut>('/sales/garments', payload)
      return res.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_GARMENTS_QUERY_KEY })
    },
  })
}

export function useUpdateGarment() {
  const queryClient = useQueryClient()
  return useMutation<GarmentOut, Error, { id: number; data: Partial<GarmentIn> }>({
    mutationFn: async ({ id, data }) => {
      const res = await apiClient.patch<GarmentOut>(`/sales/garments/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_GARMENTS_QUERY_KEY })
    },
  })
}

export function useDeleteGarment() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/sales/garments/${id}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_GARMENTS_QUERY_KEY })
    },
  })
}
