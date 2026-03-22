import { useState, useEffect } from 'react'
import { Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDashboardStore } from '@/stores/dashboard.store'
import { getCurrency, formatFiatPrice } from '../data/currencies'
import { cn } from '@/lib/utils'
import type { DashboardGarment, InventarioSubTab } from '../types'
import type { GarmentOut } from '@/api/generated/types.gen'
import { SellerChatView } from './SellerChatView'
import { PublishedListingsView } from './PublishedListingsView'
import { PublishGarmentForm } from './PublishGarmentForm'
import { PublishedGarmentDetail } from './PublishedGarmentDetail'

type InternalView = 'grid' | 'sellerChat' | 'publishForm' | 'publishedDetail'

export function InventarioTab() {
  const { t } = useTranslation()
  const likedItems = useDashboardStore((s) => s.likedItems)
  const selectedCurrency = useDashboardStore((s) => s.selectedCurrency)
  const pendingSellerChatGarment = useDashboardStore((s) => s.pendingSellerChatGarment)
  const setPendingSellerChatGarment = useDashboardStore((s) => s.setPendingSellerChatGarment)
  const currency = getCurrency(selectedCurrency)

  const [subTab, setSubTab] = useState<InventarioSubTab>('liked')
  const [view, setView] = useState<InternalView>('grid')
  const [selectedGarment, setSelectedGarment] = useState<DashboardGarment | null>(null)
  const [selectedPublished, setSelectedPublished] = useState<GarmentOut | null>(null)

  useEffect(() => {
    if (pendingSellerChatGarment) {
      setSelectedGarment(pendingSellerChatGarment)
      setView('sellerChat')
      setPendingSellerChatGarment(null)
    }
  }, [pendingSellerChatGarment, setPendingSellerChatGarment])

  const handleGarmentClick = (garment: DashboardGarment) => {
    setSelectedGarment(garment)
    setView('sellerChat')
  }

  const handlePublishedGarmentClick = (garment: GarmentOut) => {
    setSelectedPublished(garment)
    setView('publishedDetail')
  }

  const handleBack = () => {
    setSelectedGarment(null)
    setSelectedPublished(null)
    setView('grid')
  }

  const handlePublish = () => {
    setView('grid')
    setSubTab('published')
  }

  if (view === 'sellerChat' && selectedGarment !== null) {
    return <SellerChatView garment={selectedGarment} onBack={handleBack} />
  }

  if (view === 'publishForm') {
    return <PublishGarmentForm onBack={handleBack} onPublish={handlePublish} />
  }

  if (view === 'publishedDetail' && selectedPublished !== null) {
    return <PublishedGarmentDetail garment={selectedPublished} onBack={handleBack} />
  }

  const showLikedEmpty = subTab === 'liked' && likedItems.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab toggle */}
      <div className="flex p-2 gap-1 border-b border-pl-gray-700 shrink-0">
        <SubTabButton
          active={subTab === 'liked'}
          onClick={() => setSubTab('liked')}
          label={t('dashboard.inventario.subTabLiked')}
        />
        <SubTabButton
          active={subTab === 'published'}
          onClick={() => setSubTab('published')}
          label={t('dashboard.inventario.subTabPublished')}
        />
      </div>

      {/* Content */}
      {showLikedEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4 flex-1">
          <Package className="w-10 h-10 text-pl-gray-600" />
          <div>
            <p className="text-[13px] font-medium text-pl-white/80 font-body mb-1">
              {t('dashboard.inventario.emptyTitle')}
            </p>
            <p className="text-[11px] text-pl-gray-500 font-body leading-relaxed">
              {t('dashboard.inventario.emptyDescription')}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {subTab === 'liked' ? (
            <div className="p-3">
              <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-gray-400 font-body mb-3 px-1">
                {t('dashboard.inventario.itemCount', { count: likedItems.length })}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {likedItems.map(({ garment }) => (
                  <button
                    key={garment.id}
                    onClick={() => handleGarmentClick(garment)}
                    className="relative aspect-square rounded-lg overflow-hidden group border border-pl-gray-700 hover:border-pl-gray-500 transition-colors text-left"
                  >
                    <img
                      src={garment.images[0]}
                      alt={garment.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
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
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <PublishedListingsView
              onAdd={() => setView('publishForm')}
              onGarmentClick={handlePublishedGarmentClick}
            />
          )}
        </div>
      )}
    </div>
  )
}

interface SubTabButtonProps {
  active: boolean
  onClick: () => void
  label: string
}

function SubTabButton({ active, onClick, label }: SubTabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 py-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase font-body rounded-sm transition-colors',
        active
          ? 'bg-pl-accent text-pl-black'
          : 'text-pl-gray-400 hover:text-pl-white',
      )}
    >
      {label}
    </button>
  )
}
