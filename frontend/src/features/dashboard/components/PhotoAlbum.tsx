import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePhotoAlbum } from '../hooks/usePhotoAlbum'

interface PhotoAlbumProps {
  images: string[]
  name: string
  className?: string | undefined
}

export function PhotoAlbum({ images, name, className }: PhotoAlbumProps) {
  const { currentIndex, total, next, prev, goTo } = usePhotoAlbum(images.length)

  const currentImage = images[currentIndex]

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    prev()
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    next()
  }

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    goTo(index)
  }

  return (
    <div className={cn('photo-album relative w-full h-full select-none', className)}>
      {/* Image */}
      {currentImage !== undefined && (
        <img
          src={currentImage}
          alt={`${name} — foto ${currentIndex + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />
      )}

      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <div className="photo-album-arrows absolute inset-y-0 left-0 flex items-center pl-2 z-10">
            <button
              onClick={handlePrev}
              aria-label="Foto anterior"
              className="w-8 h-8 rounded-full bg-pl-black/50 backdrop-blur-sm flex items-center justify-center text-pl-white hover:bg-pl-black/70 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="photo-album-arrows absolute inset-y-0 right-0 flex items-center pr-2 z-10">
            <button
              onClick={handleNext}
              aria-label="Siguiente foto"
              className="w-8 h-8 rounded-full bg-pl-black/50 backdrop-blur-sm flex items-center justify-center text-pl-white hover:bg-pl-black/70 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-16 inset-x-0 flex justify-center gap-1.5 z-10">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={(e) => handleDotClick(e, i)}
              aria-label={`Foto ${i + 1}`}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all duration-200',
                i === currentIndex ? 'bg-pl-white w-3' : 'bg-pl-white/40',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
