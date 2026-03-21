import { Heart, Star, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { GARMENTS } from '../data/garments'
import { useSwipeCards } from '../hooks/useSwipeCards'
import { SwipeCard } from './SwipeCard'

export function SwipeCardStack() {
  const { t } = useTranslation()
  const {
    visibleCards,
    topCardStamp,
    isExiting,
    exitDirection,
    swipe,
    handleTouchStart,
    handleTouchEnd,
  } = useSwipeCards(GARMENTS)

  return (
    /* Phone frame */
    <div
      className="mx-auto"
      style={{
        width: '320px',
        height: '620px',
        background: '#1A1A1A',
        borderRadius: '40px',
        border: '2px solid #303030',
        padding: '12px',
        boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,245,245,0.05)',
        flexShrink: 0,
      }}
    >
      {/* Phone screen */}
      <div
        className="relative w-full h-full bg-pl-black overflow-hidden"
        style={{ borderRadius: '30px' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 bg-pl-black z-30"
          style={{ width: '120px', height: '28px', borderRadius: '0 0 20px 20px' }}
        />

        {/* Card stack */}
        <div className="absolute inset-0">
          {[...visibleCards].reverse().map(({ garment, stackPosition }) => (
            <SwipeCard
              key={garment.name}
              garment={garment}
              stackPosition={stackPosition}
              stampState={stackPosition === 0 ? topCardStamp : 'none'}
              isExiting={stackPosition === 0 && isExiting}
              exitDirection={stackPosition === 0 ? exitDirection : null}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-4">
          <button
            onClick={() => swipe('nope')}
            title={t('landing.swipe.btnPass')}
            aria-label={t('landing.swipe.btnPass')}
            className="flex items-center justify-center text-[22px] cursor-pointer border-0 transition-all duration-300 hover:scale-110"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#303030',
              color: '#FF4D6A',
              transitionTimingFunction: 'var(--pl-ease-spring)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={() => swipe('save')}
            title={t('landing.swipe.btnSave')}
            aria-label={t('landing.swipe.btnSave')}
            className="flex items-center justify-center cursor-pointer border-0 transition-all duration-300 hover:scale-110"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#303030',
              color: '#F5F5F5',
              transitionTimingFunction: 'var(--pl-ease-spring)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <Star className="w-6 h-6" />
          </button>
          <button
            onClick={() => swipe('match')}
            title={t('landing.swipe.btnMatch')}
            aria-label={t('landing.swipe.btnMatch')}
            className="flex items-center justify-center cursor-pointer border-0 transition-all duration-300 hover:scale-110"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#C8FF00',
              color: '#0A0A0A',
              transitionTimingFunction: 'var(--pl-ease-spring)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <Heart className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
