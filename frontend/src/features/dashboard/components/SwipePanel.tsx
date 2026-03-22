import { useState } from 'react'
import { RefreshCw, Filter, MessageCircle, Heart, Sparkles, X, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDashboardSwipe } from '../hooks/useDashboardSwipe'
import { DashboardSwipeCard } from './DashboardSwipeCard'
import { SwipeActions } from './SwipeActions'
import { ReferencePhotoPrompt } from './ReferencePhotoPrompt'
import { useDashboardStore } from '@/stores/dashboard.store'
import { useProfileStore } from '@/stores/profile.store'
import type { DashboardGarment } from '../types'
import { FEATURE_FLAGS } from '@/features/flags'
import { useNearbyGarments, type GarmentFilters, type Coordinates } from '../hooks/useNearbyGarments'
import { useGarmentFeed } from '../hooks/useGarments'
import { FiltersDrawer } from './FiltersDrawer'
import { useTotalUnread } from '../hooks/useConversations'

export function SwipePanel() {
  const { t } = useTranslation()
  const { resetSeen, setActiveTab, setMobileOverlay, createChat } = useDashboardStore()
  const referencePhotos = useProfileStore((s) => s.referencePhotos)
  const totalUnread = useTotalUnread()

  const [showPhotoPrompt, setShowPhotoPrompt] = useState(false)
  const [pendingGarment, setPendingGarment] = useState<DashboardGarment | null>(null)
  const [matchedGarment, setMatchedGarment] = useState<DashboardGarment | null>(null)
  const setPendingSellerChatGarment = useDashboardStore((s) => s.setPendingSellerChatGarment)

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

  // Priority: nearby (if proximity enabled) > backend feed
  const baseGarments = FEATURE_FLAGS.PROXIMITY_SORT && nearbyGarments
    ? nearbyGarments
    : feedGarments ?? []

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
    canUndo,
    dragOffset,
    isDragging,
    swipe,
    undo,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
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
    <div className="relative h-full bg-pl-black overflow-hidden">
      {/* Top-right actions */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={() => {
            setActiveTab('match')
            setMobileOverlay('match')
          }}
          className={`relative lg:hidden bg-black/50 backdrop-blur-md border border-white/10 p-2.5 rounded-full hover:bg-black/70 transition-colors shadow-lg flex items-center justify-center ${totalUnread > 0 ? 'text-pl-accent' : 'text-pl-white'}`}
        >
          <MessageCircle className="w-5 h-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-black" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('perfil')
            setMobileOverlay('perfil')
          }}
          className="bg-black/50 backdrop-blur-md border border-white/10 text-pl-white p-2.5 rounded-full hover:bg-black/70 transition-colors shadow-lg flex items-center justify-center"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Cards area — fills entire container */}
      <div
        className="absolute inset-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
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
          <div className="absolute inset-0">
            {[...visibleCards].reverse().map(({ garment, stackPosition }) => (
              <DashboardSwipeCard
                key={garment.id}
                garment={garment}
                stackPosition={stackPosition}
                stampState={stackPosition === 0 ? topCardStamp : 'none'}
                isExiting={stackPosition === 0 ? isExiting : false}
                exitDirection={stackPosition === 0 ? exitDirection : null}
                dragOffset={stackPosition === 0 ? dragOffset : 0}
                isDragging={stackPosition === 0 && isDragging}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action buttons — floating over the card, above mobile navbar */}
      <div className="absolute inset-x-0 z-20 bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-8">
        <SwipeActions
          onDislike={() => swipe('dislike')}
          onTryOn={handleTryOn}
          onLike={() => {
            const topGarment = visibleCards[0]?.garment
            if (topGarment) setMatchedGarment(topGarment)
            swipe('like')
          }}
          onUndo={undo}
          disabled={isEmpty || isLoading}
          canUndo={canUndo}
        />
      </div>

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

      {/* Match popup */}
      {matchedGarment && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-6"
          onClick={() => setMatchedGarment(null)}
        >
          <div
            className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl overflow-hidden shadow-2xl scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setMatchedGarment(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-pl-gray-700/80 flex items-center justify-center hover:bg-pl-gray-600 transition-colors z-10"
            >
              <X className="w-4 h-4 text-pl-gray-400" />
            </button>

            {/* Garment image */}
            <div className="relative h-48 overflow-hidden">
              {matchedGarment.images[0] && (
                <img
                  src={matchedGarment.images[0]}
                  alt={matchedGarment.name}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-pl-gray-800 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="px-5 pb-5 -mt-8 relative">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-pl-accent fill-pl-accent" />
                <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-pl-accent font-body">
                  {t('dashboard.match.matchPopupTitle')}
                </span>
              </div>
              <p className="text-[15px] font-semibold text-pl-white font-body leading-tight mb-1">
                {matchedGarment.name}
              </p>
              <p className="text-[12px] text-pl-gray-400 font-body mb-5">
                {matchedGarment.pricePLR} PLR · {matchedGarment.seller.name}
              </p>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setPendingSellerChatGarment(matchedGarment)
                    setMatchedGarment(null)
                    setActiveTab('inventario')
                    setMobileOverlay('inventario')
                  }}
                  className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase py-3 bg-pl-accent text-pl-black font-body rounded-lg hover:bg-pl-accent-dim transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('dashboard.match.chatWithSeller')}
                </button>
                <button
                  onClick={() => {
                    createChat(matchedGarment.id, matchedGarment.name, matchedGarment.images[0] ?? '')
                    setMatchedGarment(null)
                    setActiveTab('vestidor')
                    setMobileOverlay('vestidor')
                  }}
                  className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.08em] uppercase py-3 bg-pl-accent/15 border border-pl-accent/40 text-pl-accent font-body rounded-lg hover:bg-pl-accent/25 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  {t('dashboard.match.tryOnAI')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
