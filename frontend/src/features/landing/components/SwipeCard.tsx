import type { Garment } from '../data/garments'

type StampState = 'none' | 'match' | 'nope'
type ExitDirection = 'right' | 'left' | 'up' | null

interface SwipeCardProps {
  garment: Garment
  stackPosition: number
  stampState: StampState
  isExiting: boolean
  exitDirection: ExitDirection
}

function getExitTransform(direction: ExitDirection): string {
  if (direction === 'right') return 'translateX(120%) rotate(15deg)'
  if (direction === 'left') return 'translateX(-120%) rotate(-15deg)'
  if (direction === 'up') return 'translateY(-120%)'
  return ''
}

export function SwipeCard({
  garment,
  stackPosition,
  stampState,
  isExiting,
  exitDirection,
}: SwipeCardProps) {
  const scale = 1 - stackPosition * 0.04
  const translateY = stackPosition * 8
  const zIndex = 10 - stackPosition
  const opacity = stackPosition === 0 ? 1 : 0.6

  const baseTransform = `scale(${scale}) translateY(${translateY}px)`
  const currentTransform = isExiting && exitDirection !== null
    ? getExitTransform(exitDirection)
    : baseTransform

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        opacity: isExiting ? 0 : opacity,
        overflow: 'hidden',
        borderRadius: '12px',
        transform: currentTransform,
        transition: isExiting
          ? 'transform 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.6s'
          : 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Background image */}
      <img
        src={garment.img}
        alt={garment.name}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />

      {/* Info overlay */}
      <div
        className="absolute inset-x-0 bottom-0 p-5 z-10"
        style={{
          background: 'linear-gradient(transparent, rgba(10,10,10,0.9))',
        }}
      >
        <h3 className="font-display text-sm font-bold text-pl-white uppercase tracking-[0.04em]">
          {garment.name}
        </h3>
        <p className="text-[11px] text-pl-gray-300 mt-1 font-body">{garment.meta}</p>
        <span className="text-[11px] text-pl-accent font-medium mt-1 block font-body">
          {garment.price}
        </span>
      </div>

      {/* MATCH stamp */}
      <div
        className={`swipe-stamp absolute top-6 right-4 font-display text-3xl font-extrabold uppercase px-2 py-1 border-4 border-pl-accent text-pl-accent rounded-lg ${stampState === 'match' ? 'show' : ''}`}
        style={{ rotate: '-15deg', transformOrigin: 'center' }}
      >
        MATCH
      </div>

      {/* NOPE stamp */}
      <div
        className={`swipe-stamp absolute top-6 left-4 font-display text-3xl font-extrabold uppercase px-2 py-1 border-4 border-pl-red text-pl-red rounded-lg ${stampState === 'nope' ? 'show' : ''}`}
        style={{ rotate: '15deg', transformOrigin: 'center' }}
      >
        NOPE
      </div>
    </div>
  )
}
