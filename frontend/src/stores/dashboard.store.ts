import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  DashboardGarment,
  DashboardTab,
  LikedItem,
  CreditTransaction,
  AIChat,
  AIChatMessage,
  CurrencyCode,
  SellerChat,
  SellerChatMessage,
  PublishedGarment,
} from '@/features/dashboard/types'
import { MOCK_TRANSACTIONS } from '@/features/dashboard/data/transactions'
import { DEFAULT_CURRENCY } from '@/features/dashboard/data/currencies'

interface DashboardState {
  likedItems: LikedItem[]
  addLikedItem: (garment: DashboardGarment) => void
  removeLikedItem: (garmentId: string) => void

  credits: number
  transactions: CreditTransaction[]
  addTransaction: (tx: Omit<CreditTransaction, 'id'>) => void

  activeTab: DashboardTab
  setActiveTab: (tab: DashboardTab) => void

  chats: AIChat[]
  activeChat: string | null
  createChat: (garmentId: string, garmentName: string, garmentThumb: string) => string
  setActiveChat: (chatId: string | null) => void
  addMessage: (chatId: string, message: Omit<AIChatMessage, 'id' | 'timestamp'>) => void

  seenGarmentIds: string[]
  markAsSeen: (garmentId: string) => void
  resetSeen: () => void

  selectedCurrency: CurrencyCode
  setSelectedCurrency: (code: CurrencyCode) => void

  sellerChats: SellerChat[]
  createSellerChat: (garment: DashboardGarment) => string
  addSellerMessage: (chatId: string, msg: Omit<SellerChatMessage, 'id' | 'timestamp'>) => void

  publishedGarments: PublishedGarment[]
  addPublishedGarment: (garment: Omit<PublishedGarment, 'id' | 'publishedAt' | 'status'>) => void
  removePublishedGarment: (garmentId: string) => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      likedItems: [],
      addLikedItem: (garment) =>
        set((state) => ({
          likedItems: state.likedItems.some((i) => i.garment.id === garment.id)
            ? state.likedItems
            : [...state.likedItems, { garment, likedAt: Date.now() }],
        })),
      removeLikedItem: (garmentId) =>
        set((state) => ({
          likedItems: state.likedItems.filter((i) => i.garment.id !== garmentId),
        })),

      credits: 240,
      transactions: MOCK_TRANSACTIONS,
      addTransaction: (tx) =>
        set((state) => ({
          credits: state.credits + tx.amount,
          transactions: [
            { ...tx, id: `tx-${Date.now()}` },
            ...state.transactions,
          ],
        })),

      activeTab: 'inventario',
      setActiveTab: (tab) => set({ activeTab: tab }),

      chats: [],
      activeChat: null,
      createChat: (garmentId, garmentName, garmentThumb) => {
        const id = `chat-${Date.now()}`
        const newChat: AIChat = {
          id,
          garmentId,
          garmentName,
          garmentThumb,
          messages: [
            {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: `¡Hola! Veo que te interesa el/la "${garmentName}". ¿Querés subir tu foto para ver cómo te queda?`,
              timestamp: Date.now(),
            },
          ],
          createdAt: Date.now(),
        }
        set((state) => ({ chats: [...state.chats, newChat], activeChat: id }))
        return id
      },
      setActiveChat: (chatId) => set({ activeChat: chatId }),
      addMessage: (chatId, message) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    { ...message, id: `msg-${Date.now()}`, timestamp: Date.now() },
                  ],
                }
              : chat,
          ),
        })),

      seenGarmentIds: [],
      markAsSeen: (garmentId) =>
        set((state) => ({
          seenGarmentIds: state.seenGarmentIds.includes(garmentId)
            ? state.seenGarmentIds
            : [...state.seenGarmentIds, garmentId],
        })),
      resetSeen: () => set({ seenGarmentIds: [] }),

      selectedCurrency: DEFAULT_CURRENCY,
      setSelectedCurrency: (code) => set({ selectedCurrency: code }),

      sellerChats: [],
      createSellerChat: (garment) => {
        const existing = get().sellerChats.find((c) => c.garmentId === garment.id)
        if (existing) return existing.id

        const id = `seller-chat-${Date.now()}`
        const newChat: SellerChat = {
          id,
          garmentId: garment.id,
          garment,
          messages: [
            {
              id: `msg-${Date.now()}`,
              role: 'seller',
              content: `¡Hola! Vi que te interesa mi "${garment.name}". Preguntame lo que quieras 😊`,
              timestamp: Date.now(),
            },
          ],
          createdAt: Date.now(),
        }
        set((state) => ({ sellerChats: [...state.sellerChats, newChat] }))
        return id
      },
      addSellerMessage: (chatId, msg) =>
        set((state) => ({
          sellerChats: state.sellerChats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    { ...msg, id: `msg-${Date.now()}`, timestamp: Date.now() },
                  ],
                }
              : chat,
          ),
        })),

      publishedGarments: [],
      addPublishedGarment: (garment) =>
        set((state) => ({
          publishedGarments: [
            ...state.publishedGarments,
            {
              ...garment,
              id: `pub-${Date.now()}`,
              publishedAt: Date.now(),
              status: 'active' as const,
            },
          ],
        })),
      removePublishedGarment: (garmentId) =>
        set((state) => ({
          publishedGarments: state.publishedGarments.filter((g) => g.id !== garmentId),
        })),
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        likedItems: state.likedItems,
        credits: state.credits,
        transactions: state.transactions,
        chats: state.chats,
        seenGarmentIds: state.seenGarmentIds,
        selectedCurrency: state.selectedCurrency,
        sellerChats: state.sellerChats,
        publishedGarments: state.publishedGarments,
      }),
    },
  ),
)
