import { useState, useRef } from 'react'
import { ArrowLeft, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDashboardStore } from '@/stores/dashboard.store'
import { getCurrency, formatFiatPrice } from '../data/currencies'
import { MOCK_SELLER_RESPONSES } from '../data/seller-responses'
import { SellerProfileModal } from './SellerProfileModal'
import { cn } from '@/lib/utils'
import type { DashboardGarment } from '../types'

interface SellerChatViewProps {
  garment: DashboardGarment
  onBack: () => void
}

export function SellerChatView({ garment, onBack }: SellerChatViewProps) {
  const { t } = useTranslation()
  const { sellerChats, createSellerChat, addSellerMessage, selectedCurrency } =
    useDashboardStore()

  const [inputValue, setInputValue] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const chatId = createSellerChat(garment)
  const chat = sellerChats.find((c) => c.id === chatId) ?? null
  const currency = getCurrency(selectedCurrency)

  const handleSend = () => {
    if (!inputValue.trim()) return
    addSellerMessage(chatId, { role: 'buyer', content: inputValue.trim() })
    setInputValue('')

    const delay = 1000 + Math.random() * 500
    setTimeout(() => {
      const responses = MOCK_SELLER_RESPONSES
      const response = responses[Math.floor(Math.random() * responses.length)]
      if (response !== undefined) {
        addSellerMessage(chatId, { role: 'seller', content: response })
      }
    }, delay)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="relative flex flex-col h-full slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-pl-gray-700 shrink-0">
        <button
          onClick={onBack}
          aria-label={t('common.back')}
          className="text-pl-gray-400 hover:text-pl-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
          aria-label={t('dashboard.sellerChat.viewProfile')}
        >
          <img
            src={garment.seller.avatarUrl}
            alt={garment.seller.name}
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-pl-white font-body truncate leading-tight">
              {garment.seller.name}
            </p>
            <p className="text-[10px] text-pl-accent font-body">{t('dashboard.sellerChat.viewProfile')}</p>
          </div>
        </button>
      </div>

      {/* Garment details collapsible */}
      <div className="border-b border-pl-gray-700 shrink-0">
        <button
          onClick={() => setDetailsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-pl-gray-700/40 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={garment.images[0]}
              alt={garment.name}
              className="w-8 h-8 rounded object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-pl-white font-body truncate">{garment.name}</p>
              <p className="text-[10px] text-pl-gray-400 font-body">
                {formatFiatPrice(garment.pricePLR, currency)}{' '}
                <span className="text-pl-accent">{garment.pricePLR} PLR</span>
              </p>
            </div>
          </div>
          {detailsOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-pl-gray-500 shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-pl-gray-500 shrink-0" />
          )}
        </button>

        {detailsOpen && (
          <div className="px-3 pb-3">
            {/* Thumbnail strip */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-2">
              {garment.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${garment.name} ${i + 1}`}
                  className="w-16 h-16 rounded object-cover shrink-0"
                />
              ))}
            </div>
            {/* Meta */}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span className="text-[10px] text-pl-gray-400 font-body">
                {t('dashboard.garment.size')}: <span className="text-pl-white">{garment.size}</span>
              </span>
              <span className="text-[10px] text-pl-gray-400 font-body">
                {t('dashboard.garment.condition')}: <span className="text-pl-white">{garment.condition}</span>
              </span>
              <span className="text-[10px] text-pl-gray-400 font-body">
                {t('dashboard.garment.location')}: <span className="text-pl-white">{garment.location}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-3">
          {chat?.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex', msg.role === 'buyer' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'seller' && (
                <img
                  src={garment.seller.avatarUrl}
                  alt={garment.seller.name}
                  className="w-6 h-6 rounded-full object-cover mr-2 mt-1 shrink-0"
                />
              )}
              <div
                className={cn(
                  'max-w-[85%] px-3 py-2 rounded-2xl text-[12px] font-body leading-relaxed',
                  msg.role === 'buyer'
                    ? 'bg-pl-accent text-pl-black rounded-tr-sm'
                    : 'bg-pl-gray-700 text-pl-white rounded-tl-sm',
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-2 border-t border-pl-gray-700 flex items-center gap-2 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('dashboard.sellerChat.placeholder')}
          className="flex-1 min-w-0 bg-pl-gray-700 border border-pl-gray-600 text-pl-white placeholder:text-pl-gray-500 text-[12px] font-body rounded-full px-3 py-1.5 focus:outline-none focus:border-pl-accent/60"
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim()}
          aria-label="Enviar"
          className="w-8 h-8 rounded-full bg-pl-accent text-pl-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-pl-accent-dim transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Seller profile modal */}
      {showProfile && (
        <SellerProfileModal garment={garment} onClose={() => setShowProfile(false)} />
      )}
    </div>
  )
}
