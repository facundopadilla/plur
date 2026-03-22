import { Plus, Tag, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDashboardStore } from '@/stores/dashboard.store'
import { useMyGarments } from '../hooks/useGarments'
import { getCurrency, formatFiatPrice } from '../data/currencies'
import { cn } from '@/lib/utils'
import type { GarmentOut } from '@/api/generated/types.gen'

interface PublishedListingsViewProps {
  onAdd: () => void
  onGarmentClick: (garment: GarmentOut) => void
}

export function PublishedListingsView({ onAdd, onGarmentClick }: PublishedListingsViewProps) {
  const { t } = useTranslation()
  const { data: garments, isLoading, isError } = useMyGarments()
  const selectedCurrency = useDashboardStore((s) => s.selectedCurrency)
  const currency = getCurrency(selectedCurrency)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-5">
        <Loader2 className="w-6 h-6 text-pl-gray-500 animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-5 text-center gap-4">
        <p className="text-[12px] text-pl-gray-400 font-body">{t('common.error')}</p>
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

  if (!garments || garments.length === 0) {
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
          {t('dashboard.publish.listingCount', { count: garments.length })}
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
        {/* Add new garment card */}
        <button
          onClick={onAdd}
          className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-pl-gray-600 hover:border-pl-accent/60 transition-colors flex flex-col items-center justify-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-full bg-pl-gray-700 flex items-center justify-center group-hover:bg-pl-accent/15 transition-colors">
            <Plus className="w-5 h-5 text-pl-gray-400 group-hover:text-pl-accent transition-colors" />
          </div>
          <p className="text-[10px] font-semibold text-pl-gray-400 group-hover:text-pl-accent font-body uppercase tracking-[0.1em] transition-colors">
            {t('dashboard.publish.newListing')}
          </p>
        </button>
        {garments.map((garment) => (
          <button
            key={garment.id}
            onClick={() => onGarmentClick(garment)}
            className="relative aspect-square rounded-lg overflow-hidden border border-pl-gray-700 hover:border-pl-gray-500 transition-colors text-left"
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
            <div
              className="absolute inset-x-0 bottom-0 p-2"
              style={{ background: 'linear-gradient(transparent, rgba(10,10,10,0.85))' }}
            >
              <p className="text-[10px] font-semibold text-pl-white font-body truncate uppercase tracking-[0.04em]">
                {garment.name}
              </p>
              <p className="text-[10px] text-pl-white font-body font-medium">
                {formatFiatPrice(garment.price_plr, currency)}
              </p>
              <p className="text-[10px] text-pl-accent font-body font-medium">
                {garment.price_plr} PLR
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
