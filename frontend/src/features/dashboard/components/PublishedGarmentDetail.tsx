import { useState } from 'react'
import { ArrowLeft, QrCode, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getCurrency, formatFiatPrice } from '../data/currencies'
import { useDashboardStore } from '@/stores/dashboard.store'
import { SaleQRModal } from './SaleQRModal'
import type { PublishedGarment } from '../types'

interface PublishedGarmentDetailProps {
  garment: PublishedGarment
  onBack: () => void
}

export function PublishedGarmentDetail({ garment, onBack }: PublishedGarmentDetailProps) {
  const { t } = useTranslation()
  const selectedCurrency = useDashboardStore((s) => s.selectedCurrency)
  const currency = getCurrency(selectedCurrency)
  const [showQR, setShowQR] = useState(false)
  const [activeImage, setActiveImage] = useState(0)

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
        <p className="text-[13px] font-semibold text-pl-white font-body truncate flex-1">
          {garment.name}
        </p>
        <span
          className={cn(
            'text-[9px] font-semibold tracking-[0.1em] uppercase px-2 py-1 rounded-sm font-body shrink-0',
            garment.status === 'active'
              ? 'bg-pl-accent text-pl-black'
              : 'bg-pl-gray-600 text-pl-gray-300',
          )}
        >
          {garment.status === 'active'
            ? t('dashboard.publish.statusActive')
            : t('dashboard.publish.statusSold')}
        </span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Main image */}
        <div className="aspect-square bg-pl-gray-800 relative">
          {garment.images[activeImage] ? (
            <img
              src={garment.images[activeImage]}
              alt={garment.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag className="w-10 h-10 text-pl-gray-600" />
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {garment.images.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-3 py-2">
            {garment.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={cn(
                  'w-14 h-14 rounded object-cover shrink-0 overflow-hidden border-2 transition-colors',
                  i === activeImage ? 'border-pl-accent' : 'border-pl-gray-600',
                )}
              >
                <img src={img} alt={`${garment.name} ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="px-4 py-3 space-y-3">
          {/* Price */}
          <div>
            <p className="text-[11px] text-pl-gray-500 font-body uppercase tracking-[0.1em] mb-0.5">
              {t('dashboard.sale.priceLabel')}
            </p>
            <p className="text-[18px] font-bold text-pl-accent font-body tracking-[0.04em]">
              {garment.pricePLR} PLR
            </p>
            <p className="text-[12px] text-pl-gray-300 font-body">
              {formatFiatPrice(garment.pricePLR, currency)}
            </p>
          </div>

          <div className="h-px bg-pl-gray-700" />

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            <MetaItem label={t('dashboard.garment.size')} value={garment.size} />
            <MetaItem label={t('dashboard.garment.condition')} value={garment.condition} />
            <MetaItem label={t('dashboard.garment.style')} value={garment.style} />
            <MetaItem label={t('dashboard.garment.location')} value={garment.location} />
          </div>

          {/* Description */}
          {garment.description && (
            <>
              <div className="h-px bg-pl-gray-700" />
              <p className="text-[12px] text-pl-gray-300 font-body leading-relaxed">
                {garment.description}
              </p>
            </>
          )}

          {/* Tags */}
          {garment.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {garment.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium px-2 py-0.5 bg-pl-gray-700 text-pl-gray-300 font-body tracking-[0.06em]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 border-t border-pl-gray-700 shrink-0">
        {garment.status === 'active' ? (
          <button
            onClick={() => setShowQR(true)}
            className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase px-4 py-3.5 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors"
          >
            <QrCode className="w-4 h-4" />
            {t('dashboard.sale.generateQR')}
          </button>
        ) : (
          <div className="w-full flex items-center justify-center text-[11px] font-semibold tracking-[0.12em] uppercase px-4 py-3.5 bg-pl-gray-700 text-pl-gray-500 font-body cursor-not-allowed">
            {t('dashboard.publish.statusSold')}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && <SaleQRModal garment={garment} onClose={() => setShowQR(false)} />}
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-pl-gray-500 font-body uppercase tracking-[0.08em]">{label}</p>
      <p className="text-[12px] text-pl-white font-body font-medium">{value}</p>
    </div>
  )
}
