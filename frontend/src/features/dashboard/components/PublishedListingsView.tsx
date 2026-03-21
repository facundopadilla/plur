import { Plus, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDashboardStore } from '@/stores/dashboard.store'
import { getCurrency, formatFiatPrice } from '../data/currencies'
import { cn } from '@/lib/utils'

interface PublishedListingsViewProps {
  onAdd: () => void
}

export function PublishedListingsView({ onAdd }: PublishedListingsViewProps) {
  const { t } = useTranslation()
  const publishedGarments = useDashboardStore((s) => s.publishedGarments)
  const selectedCurrency = useDashboardStore((s) => s.selectedCurrency)
  const currency = getCurrency(selectedCurrency)

  if (publishedGarments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-5 text-center gap-5">
        <div className="w-12 h-12 rounded-full bg-pl-gray-700 flex items-center justify-center empty-pulse">
          <Tag className="w-6 h-6 text-pl-gray-500" />
        </div>
        <div>
          <p className="text-[13px] font-medium text-pl-white/80 font-body mb-2 leading-snug">
            {t('dashboard.publish.emptyTitle')}
          </p>
          <p className="text-[11px] text-pl-gray-500 font-body leading-relaxed">
            {t('dashboard.publish.emptyDescription')}
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase px-6 py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('dashboard.publish.title')}
        </button>
      </div>
    )
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-gray-400 font-body">
          {t('dashboard.publish.listingCount', { count: publishedGarments.length })}
        </p>
        <button
          onClick={onAdd}
          className="w-6 h-6 rounded-full bg-pl-gray-700 border border-pl-gray-600 flex items-center justify-center text-pl-gray-400 hover:text-pl-white hover:border-pl-gray-400 transition-colors"
          aria-label={t('dashboard.publish.newListing')}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {publishedGarments.map((garment) => (
          <div
            key={garment.id}
            className="relative aspect-square rounded-lg overflow-hidden border border-pl-gray-700 hover:border-pl-gray-500 transition-colors"
          >
            {garment.images[0] ? (
              <img
                src={garment.images[0]}
                alt={garment.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-pl-gray-700 flex items-center justify-center">
                <Tag className="w-6 h-6 text-pl-gray-600" />
              </div>
            )}
            {/* Status badge */}
            <div className="absolute top-1.5 right-1.5">
              <span
                className={cn(
                  'text-[9px] font-semibold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-sm font-body',
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
            {/* Info overlay */}
            <div
              className="absolute inset-x-0 bottom-0 p-2"
              style={{ background: 'linear-gradient(transparent, rgba(10,10,10,0.85))' }}
            >
              <p className="text-[10px] font-semibold text-pl-white font-body truncate uppercase tracking-[0.04em]">
                {garment.name}
              </p>
              <p className="text-[10px] text-pl-white font-body font-medium">
                {formatFiatPrice(garment.pricePLR, currency)}
              </p>
              <p className="text-[10px] text-pl-accent font-body font-medium">
                {garment.pricePLR} PLR
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
