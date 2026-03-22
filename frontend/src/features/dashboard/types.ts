export type CurrencyCode = 'ARS' | 'USD' | 'CLP' | 'BRL' | 'EUR' | 'MXN'

export interface Currency {
  code: CurrencyCode
  symbol: string
  name: string
  rateToPLR: number
}

export interface DashboardGarment {
  id: string
  name: string
  description: string
  images: string[]
  pricePLR: number
  size: string
  style: string
  condition: string
  location: string
  tags: string[]
  seller: {
    name: string
    avatarUrl: string
    bio: string
  }
}

export type DashboardTab = 'inventario' | 'vestidor' | 'creditos' | 'publicar' | 'perfil' | 'match'

export interface LikedItem {
  garment: DashboardGarment
  likedAt: number
}

export interface CreditTransaction {
  id: string
  type: 'earned' | 'spent' | 'purchased'
  amount: number
  description: string
  date: string
  txHash?: string | undefined
}

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string | undefined
  timestamp: number
}

export interface AIChat {
  id: string
  garmentId: string
  garmentName: string
  garmentThumb: string
  messages: AIChatMessage[]
  createdAt: number
}

export type StampState = 'none' | 'match' | 'nope'
export type ExitDirection = 'right' | 'left' | null

export interface SellerChatMessage {
  id: string
  role: 'buyer' | 'seller'
  content: string
  timestamp: number
}

export interface SellerChat {
  id: string
  garmentId: string
  garment: DashboardGarment
  messages: SellerChatMessage[]
  createdAt: number
}

export interface PublishedGarment {
  id: string
  backendId?: number | undefined
  name: string
  description: string
  images: string[]
  pricePLR: number
  size: string
  style: string
  condition: string
  location: string
  tags: string[]
  publishedAt: number
  status: 'active' | 'sold'
}

export type InventarioSubTab = 'liked' | 'published'

export interface QRSalePayload {
  garmentId: string
  name: string
  pricePLR: number
  seller: string
}
