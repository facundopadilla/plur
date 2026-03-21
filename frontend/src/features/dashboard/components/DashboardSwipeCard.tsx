import type { DashboardGarment, StampState, ExitDirection } from '../types'
import { PhotoAlbum } from './PhotoAlbum'
import { GarmentInfo } from './GarmentInfo'

interface DashboardSwipeCardProps {
  garment: DashboardGarment
  stackPosition: number
  stampState: StampState
  isExiting: boolean
  exitDirection: ExitDirection
}

function getExitTransform(direction: ExitDirection): string {
  if (direction === 'right') return 'translateX(130%) rotate(15deg)'
  if (direction === 'left') return 'translateX(-130%) rotate(-15deg)'
  return ''
}

export function DashboardSwipeCard({
  garment,
  stackPosition,
  stampState,
  isExiting,
  exitDirection,
}: DashboardSwipeCardProps) {
  const scale = 1 - stackPosition * 0.04
  const translateY = stackPosition * 10
  const zIndex = 10 - stackPosition
  const opacity = stackPosition === 0 ? 1 : 0.65

  const baseTransform = `scale(${scale}) translateY(${translateY}px)`
  const currentTransform =
    isExiting && exitDirection !== null ? getExitTransform(exitDirection) : baseTransform

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        opacity: isExiting ? 0 : opacity,
        overflow: 'hidden',
        borderRadius: '16px',
        transform: currentTransform,
        transition: isExiting
          ? 'transform 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.5s'
          : 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Photo album — only interactive on top card */}
      {stackPosition === 0 ? (
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

      {/* Info overlay — only on top card */}
      {stackPosition === 0 && <GarmentInfo garment={garment} />}

      {/* MATCH stamp */}
      <div
        className={`swipe-stamp absolute top-6 right-4 font-display text-3xl font-extrabold uppercase px-3 py-1.5 border-4 border-pl-accent text-pl-accent rounded-xl ${stampState === 'match' ? 'show' : ''}`}
        style={{ rotate: '-12deg', transformOrigin: 'center' }}
      >
        MATCH
      </div>

      {/* NOPE stamp */}
      <div
        className={`swipe-stamp absolute top-6 left-4 font-display text-3xl font-extrabold uppercase px-3 py-1.5 border-4 border-pl-red text-pl-red rounded-xl ${stampState === 'nope' ? 'show' : ''}`}
        style={{ rotate: '12deg', transformOrigin: 'center' }}
      >
        NOPE
      </div>
    </div>
  )
}
