import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { GarmentOut, GarmentIn } from '@/api/generated/types.gen'

export const MY_GARMENTS_QUERY_KEY = ['garments', 'mine'] as const

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
