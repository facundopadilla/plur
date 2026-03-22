import { useState } from 'react'
import { RefreshCw, Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDashboardSwipe } from '../hooks/useDashboardSwipe'
import { DashboardSwipeCard } from './DashboardSwipeCard'
import { SwipeActions } from './SwipeActions'
import { ReferencePhotoPrompt } from './ReferencePhotoPrompt'
import { DASHBOARD_GARMENTS } from '../data/garments'
import { useDashboardStore } from '@/stores/dashboard.store'
import { useProfileStore } from '@/stores/profile.store'
import type { DashboardGarment } from '../types'
import { FEATURE_FLAGS } from '@/features/flags'
import { useNearbyGarments, type GarmentFilters, type Coordinates } from '../hooks/useNearbyGarments'
import { useGarmentFeed } from '../hooks/useGarments'
import { FiltersDrawer } from './FiltersDrawer'

export function SwipePanel() {
  const { t } = useTranslation()
  const { resetSeen, setActiveTab, setMobileOverlay, createChat } = useDashboardStore()
  const referencePhotos = useProfileStore((s) => s.referencePhotos)

  const [showPhotoPrompt, setShowPhotoPrompt] = useState(false)
  const [pendingGarment, setPendingGarment] = useState<DashboardGarment | null>(null)
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<GarmentFilters>({})
  const [proximityEnabled, setProximityEnabled] = useState(false)
  const [coords, setCoords] = useState<Coordinates | null>(null)

  const { data: nearbyGarments, isLoading: nearbyLoading } = useNearbyGarments({
    filters,
    coords,
    enabled: FEATURE_FLAGS.PROXIMITY_SORT,
  })

  const { data: feedGarments, isLoading: feedLoading } = useGarmentFeed()

  const isLoading = feedLoading || nearbyLoading

  // Priority: nearby (if proximity enabled) > backend feed > mock data fallback
  const baseGarments = FEATURE_FLAGS.PROXIMITY_SORT && nearbyGarments
    ? nearbyGarments
    : feedGarments && feedGarments.length > 0
      ? feedGarments
      : DASHBOARD_GARMENTS

  const garmentsToUse = baseGarments.filter((g) => {
    if (filters.style && g.style.toLowerCase() !== filters.style.toLowerCase()) return false
    if (filters.size && g.size.toLowerCase() !== filters.size.toLowerCase()) return false
    if (filters.condition && g.condition.toLowerCase() !== filters.condition.toLowerCase()) return false
    return true
  })

  const {
    visibleCards,
    topCardStamp,
    isExiting,
    exitDirection,
    isEmpty,
    swipe,
    handleTouchStart,
    handleTouchEnd,
  } = useDashboardSwipe(garmentsToUse)

  const executeTryOn = (garment: DashboardGarment) => {
    createChat(garment.id, garment.name, garment.images[0] ?? '')
    swipe('like')
    setTimeout(() => {
      setActiveTab('vestidor')
      setMobileOverlay('vestidor')
    }, 750)
  }

  const handleTryOn = () => {
    const topGarment = visibleCards[0]?.garment
    if (!topGarment || isEmpty) return

    if (referencePhotos.length === 0) {
      setPendingGarment(topGarment)
      setShowPhotoPrompt(true)
      return
    }

    executeTryOn(topGarment)
  }

  const handlePhotoPromptConfirm = () => {
    setShowPhotoPrompt(false)
    if (pendingGarment) {
      executeTryOn(pendingGarment)
      setPendingGarment(null)
    }
  }

  const handlePhotoPromptCancel = () => {
    setShowPhotoPrompt(false)
    setPendingGarment(null)
  }

  const handleProximityToggle = (enabled: boolean, newCoords: Coordinates | null) => {
    setProximityEnabled(enabled)
    setCoords(newCoords)
  }

  return (
    <div className="flex flex-col h-full bg-pl-black relative">
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={() => setIsFiltersOpen(true)}
          className="bg-pl-gray-900/80 backdrop-blur border border-pl-gray-800 text-pl-white p-3 rounded-full hover:bg-pl-gray-800 transition-colors shadow-lg flex items-center justify-center"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      <div
        className="flex-1 relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <div className="text-pl-accent animate-spin">
              <RefreshCw className="w-10 h-10" />
            </div>
            <p className="text-[13px] text-pl-gray-400 font-body leading-relaxed">
              {t('common.loading', 'Loading...')}
            </p>
          </div>
        ) : isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <div className="empty-pulse text-pl-gray-500">
              <RefreshCw className="w-14 h-14" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-extrabold uppercase tracking-[-0.03em] text-pl-white mb-2">
                {t('dashboard.swipe.emptyTitle', 'No more items')}
                <span className="text-pl-accent">.</span>
              </h3>
              <p className="text-[13px] text-pl-gray-400 font-body leading-relaxed">
                {t('dashboard.swipe.emptyDescription', 'You have seen everything.')}
              </p>
            </div>
            <button
              onClick={resetSeen}
              className="text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors"
            >
              {t('dashboard.swipe.emptyReset', 'Reset')}
            </button>
          </div>
        ) : (
          <div className="absolute inset-4 mt-16">
            {[...visibleCards].reverse().map(({ garment, stackPosition }) => (
              <DashboardSwipeCard
                key={garment.id}
                garment={garment}
                stackPosition={stackPosition}
                stampState={stackPosition === 0 ? topCardStamp : 'none'}
                isExiting={stackPosition === 0 ? isExiting : false}
                exitDirection={stackPosition === 0 ? exitDirection : null}
              />
            ))}
          </div>
        )}
      </div>

      <SwipeActions
        onDislike={() => swipe('dislike')}
        onTryOn={handleTryOn}
        onLike={() => swipe('like')}
        disabled={isEmpty || isLoading}
      />

      {showPhotoPrompt && (
        <ReferencePhotoPrompt
          onConfirm={handlePhotoPromptConfirm}
          onCancel={handlePhotoPromptCancel}
        />
      )}

      <FiltersDrawer
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        proximityEnabled={proximityEnabled}
        onProximityToggle={handleProximityToggle}
      />
    </div>
  )
}
