import { X, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDashboardStore } from '@/stores/dashboard.store'
import { getCurrency, formatFiatPrice } from '../data/currencies'
import type { DashboardGarment } from '../types'

interface SellerProfileModalProps {
  garment: DashboardGarment
  onClose: () => void
}

export function SellerProfileModal({ garment, onClose }: SellerProfileModalProps) {
  const { t } = useTranslation()
  const selectedCurrency = useDashboardStore((s) => s.selectedCurrency)
  const likedItems = useDashboardStore((s) => s.likedItems)
  const currency = getCurrency(selectedCurrency)

  const sellerGarments = likedItems
    .map((i) => i.garment)
    .filter((g) => g.seller.name === garment.seller.name)

  return (
    /* Overlay */
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Card */}
      <div
        className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="relative px-4 pt-5 pb-4 flex flex-col items-center text-center">
          <button
            onClick={onClose}
            aria-label={t('common.cancel')}
            className="absolute top-3 right-3 text-pl-gray-500 hover:text-pl-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Avatar */}
          <img
            src={garment.seller.avatarUrl.replace('?img=', '?img=').replace('/40?', '/150?')}
            alt={garment.seller.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-pl-gray-600 mb-3"
          />

          {/* Name */}
          <p className="text-[14px] font-semibold text-pl-white font-body leading-tight">
            {garment.seller.name}
          </p>

          {/* Location */}
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-pl-gray-500 shrink-0" />
            <p className="text-[11px] text-pl-gray-400 font-body">{garment.location}</p>
          </div>

          {/* Bio */}
          {garment.seller.bio && (
            <p className="text-[11px] text-pl-gray-300 font-body leading-relaxed mt-3">
              {garment.seller.bio}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-pl-gray-700 mx-4" />

        {/* Published garments */}
        <div className="px-4 py-3">
          <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-pl-gray-400 font-body mb-2">
            {t('dashboard.sellerChat.publishedGarments')}
          </p>
          {sellerGarments.length === 0 ? (
            <p className="text-[11px] text-pl-gray-500 font-body text-center py-3">
              {t('dashboard.sellerChat.noOtherGarments')}
            </p>
          ) : (
            <ScrollArea className="max-h-44">
              <div className="space-y-2">
                {sellerGarments.map((g) => (
                  <div key={g.id} className="flex items-center gap-2.5">
                    <img
                      src={g.images[0]}
                      alt={g.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-pl-white font-body truncate">
                        {g.name}
                      </p>
                      <p className="text-[10px] text-pl-gray-400 font-body">
                        {formatFiatPrice(g.pricePLR, currency)}{' '}
                        <span className="text-pl-accent">{g.pricePLR} PLR</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  )
}
