import type { DashboardGarment, StampState, ExitDirection } from '../types'
import { PhotoAlbum } from './PhotoAlbum'
import { GarmentInfo } from './GarmentInfo'

interface DashboardSwipeCardProps {
  garment: DashboardGarment
  stackPosition: number
  stampState: StampState
  isExiting: boolean
  exitDirection: ExitDirection
  dragOffset?: number
  isDragging?: boolean
}

const SWIPE_THRESHOLD = 80

function getExitTransform(direction: ExitDirection): string {
  if (direction === 'right') return 'translateX(130%) rotate(14deg)'
  if (direction === 'left') return 'translateX(-130%) rotate(-14deg)'
  return ''
}

export function DashboardSwipeCard({
  garment,
  stackPosition,
  stampState,
  isExiting,
  exitDirection,
  dragOffset = 0,
  isDragging = false,
}: DashboardSwipeCardProps) {
  const isTop = stackPosition === 0
  const scale = 1 - stackPosition * 0.03
  const translateY = stackPosition * 8
  const zIndex = 10 - stackPosition
  const opacity = stackPosition === 0 ? 1 : 0.5

  // Drag transform for top card
  const rotation = isTop ? dragOffset * 0.06 : 0
  const dragTransform = isTop && Math.abs(dragOffset) > 0
    ? `translateX(${dragOffset}px) rotate(${rotation}deg)`
    : `scale(${scale}) translateY(${translateY}px)`

  const currentTransform = isExiting && exitDirection !== null
    ? getExitTransform(exitDirection)
    : dragTransform

  // Progressive stamp opacity based on drag
  const matchOpacity = isTop && dragOffset > 20
    ? Math.min((dragOffset - 20) / (SWIPE_THRESHOLD - 20), 1)
    : 0
  const nopeOpacity = isTop && dragOffset < -20
    ? Math.min((Math.abs(dragOffset) - 20) / (SWIPE_THRESHOLD - 20), 1)
    : 0

  // Stamp visibility: from drag OR from swipe action
  const showMatch = stampState === 'match' || matchOpacity > 0
  const showNope = stampState === 'nope' || nopeOpacity > 0
  const matchFinalOpacity = stampState === 'match' ? 1 : matchOpacity
  const nopeFinalOpacity = stampState === 'nope' ? 1 : nopeOpacity

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        opacity: isExiting ? 0 : opacity,
        overflow: 'hidden',
        transform: currentTransform,
        transition: isDragging && isTop
          ? 'none'
          : isExiting
            ? 'transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s'
            : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* Photo */}
      {isTop ? (
        <PhotoAlbum images={garment.images} name={garment.name} />
      ) : (
        <img
          src={garment.images[0]}
          alt={garment.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />
      )}

      {/* Info overlay */}
      {isTop && <GarmentInfo garment={garment} />}

      {/* MATCH stamp */}
      <div
        className="absolute top-8 right-6 font-display text-4xl font-extrabold uppercase px-4 py-2 border-4 border-pl-accent text-pl-accent rounded-xl pointer-events-none"
        style={{
          rotate: '-15deg',
          transformOrigin: 'center',
          textShadow: '0 2px 12px rgba(200,255,0,0.3)',
          opacity: matchFinalOpacity,
          transform: showMatch ? 'scale(1)' : 'scale(0.5)',
          transition: isDragging ? 'none' : 'opacity 0.3s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        MATCH
      </div>

      {/* NOPE stamp */}
      <div
        className="absolute top-8 left-6 font-display text-4xl font-extrabold uppercase px-4 py-2 border-4 border-pl-red text-pl-red rounded-xl pointer-events-none"
        style={{
          rotate: '15deg',
          transformOrigin: 'center',
          textShadow: '0 2px 12px rgba(255,77,106,0.3)',
          opacity: nopeFinalOpacity,
          transform: showNope ? 'scale(1)' : 'scale(0.5)',
          transition: isDragging ? 'none' : 'opacity 0.3s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        NOPE
      </div>
    </div>
  )
}
