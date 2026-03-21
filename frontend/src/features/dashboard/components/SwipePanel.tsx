import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDashboardSwipe } from '../hooks/useDashboardSwipe'
import { DashboardSwipeCard } from './DashboardSwipeCard'
import { SwipeActions } from './SwipeActions'
import { ReferencePhotoPrompt } from './ReferencePhotoPrompt'
import { DASHBOARD_GARMENTS } from '../data/garments'
import { useDashboardStore } from '@/stores/dashboard.store'
import { useProfileStore } from '@/stores/profile.store'
import type { DashboardGarment } from '../types'

export function SwipePanel() {
  const { t } = useTranslation()
  const { resetSeen, setActiveTab, setMobileOverlay, createChat } = useDashboardStore()
  const referencePhotos = useProfileStore((s) => s.referencePhotos)

  const [showPhotoPrompt, setShowPhotoPrompt] = useState(false)
  const [pendingGarment, setPendingGarment] = useState<DashboardGarment | null>(null)

  const {
    visibleCards,
    topCardStamp,
    isExiting,
    exitDirection,
    isEmpty,
    swipe,
    handleTouchStart,
    handleTouchEnd,
  } = useDashboardSwipe(DASHBOARD_GARMENTS)

  const executeTryOn = (garment: DashboardGarment) => {
    createChat(garment.id, garment.name, garment.images[0] ?? '')
    swipe('like')
    setTimeout(() => {
      setActiveTab('espejo')
      setMobileOverlay('espejo')
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

  return (
    <div className="flex flex-col h-full bg-pl-black relative">
      {/* Card stack area */}
      <div
        className="flex-1 relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isEmpty ? (
          /* Empty state */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <div className="empty-pulse text-pl-gray-500">
              <RefreshCw className="w-14 h-14" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-extrabold uppercase tracking-[-0.03em] text-pl-white mb-2">
                {t('dashboard.swipe.emptyTitle')}
                <span className="text-pl-accent">.</span>
              </h3>
              <p className="text-[13px] text-pl-gray-400 font-body leading-relaxed">
                {t('dashboard.swipe.emptyDescription')}
              </p>
            </div>
            <button
              onClick={resetSeen}
              className="text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors"
            >
              {t('dashboard.swipe.emptyReset')}
            </button>
          </div>
        ) : (
          /* Card stack */
          <div className="absolute inset-4">
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

      {/* Action buttons */}
      <SwipeActions
        onDislike={() => swipe('dislike')}
        onTryOn={handleTryOn}
        onLike={() => swipe('like')}
        disabled={isEmpty}
      />

      {/* Reference photo prompt */}
      {showPhotoPrompt && (
        <ReferencePhotoPrompt
          onConfirm={handlePhotoPromptConfirm}
          onCancel={handlePhotoPromptCancel}
        />
      )}

    </div>
  )
}
