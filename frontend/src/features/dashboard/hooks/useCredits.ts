import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { CreditTransaction } from '../types'

export interface BackendTransaction {
  id: number
  tx_type: 'earned' | 'spent' | 'purchased'
  amount: number
  description: string
  tx_hash: string
  created_at: string
}

export function useCredits() {
  const balanceQuery = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => {
      const res = await apiClient.get<{ credits: number }>('/sales/wallet/balance')
      return res.data
    },
  })

  const transactionsQuery = useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: async () => {
      const res = await apiClient.get<BackendTransaction[]>('/sales/wallet/transactions')

      const mappedTransactions: CreditTransaction[] = res.data.map((tx) => ({
        id: String(tx.id),
        type: tx.tx_type,
        amount: tx.amount,
        description: tx.description,
        txHash: tx.tx_hash || undefined,
        date: new Date(tx.created_at).toLocaleDateString('es-AR'),
      }))

      return mappedTransactions
    },
  })

  const isLoading = balanceQuery.isLoading || transactionsQuery.isLoading
  const error = balanceQuery.error || transactionsQuery.error

  return {
    credits: balanceQuery.data?.credits ?? 0,
    transactions: transactionsQuery.data ?? [],
    isLoading,
    error,
  }
}
