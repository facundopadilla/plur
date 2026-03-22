import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export interface CreateOrderPayload {
  amount_fiat: string
  currency_fiat: string
  amount_plr: string
}

export interface CreateOrderResponse {
  order_id: number
  status: string
  transak_session_data: {
    checkout_url?: string
    [key: string]: any
  }
}

export interface OrderStatusResponse {
  id: number
  status: 'pending' | 'settled' | 'failed' | 'reconciling' | string
  amount_plr: string
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const response = await apiClient.post<CreateOrderResponse>('/payments/orders/', payload)
      return response.data
    },
  })
}

export function useOrderStatus(orderId: number | null) {
  return useQuery({
    queryKey: ['order-status', orderId],
    queryFn: async () => {
      if (!orderId) return null
      // Use trailing slash if Django requires it, or no trailing slash? 
      // Usually Django requires trailing slash.
      const response = await apiClient.get<OrderStatusResponse>(`/payments/orders/${orderId}/`)
      return response.data
    },
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'pending' || status === 'reconciling') {
        return 5000
      }
      return false
    },
  })
}
