import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export interface ConversationOut {
  id: number
  garment_id: number
  garment_name: string
  buyer_id: number
  buyer_name: string
  seller_id: number
  seller_name: string
  status: string
  created_at: string
  updated_at: string
}

export interface MessageOut {
  id: number
  conversation_id: number
  sender_id: number
  sender_name: string
  content: string
  created_at: string
}

export function useOpenConversations() {
  return useQuery({
    queryKey: ['conversations', 'open'],
    queryFn: async (): Promise<ConversationOut[]> => {
      const response = await apiClient.get<ConversationOut[]>('/match/conversations/open')
      return response.data
    },
  })
}

export function useFinalizedConversations() {
  return useQuery({
    queryKey: ['conversations', 'finalized'],
    queryFn: async (): Promise<ConversationOut[]> => {
      const response = await apiClient.get<ConversationOut[]>('/match/conversations/finalized')
      return response.data
    },
  })
}

export function useConversationMessages(conversationId: number | null) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: async (): Promise<MessageOut[]> => {
      if (conversationId === null) return []
      const response = await apiClient.get<MessageOut[]>(`/match/conversations/${conversationId}/messages`)
      return response.data
    },
    enabled: conversationId !== null,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }): Promise<MessageOut> => {
      const response = await apiClient.post<MessageOut>(`/match/conversations/${conversationId}/messages`, { content })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.conversationId, 'messages'] })
    },
  })
}
