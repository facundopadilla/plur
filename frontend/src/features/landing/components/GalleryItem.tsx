import type { GalleryItemData } from '../data/gallery-items'

interface GalleryItemProps {
  item: GalleryItemData
}

const variantStyles: Record<GalleryItemData['variant'], React.CSSProperties> = {
  default: { aspectRatio: '3/4' },
  tall: { gridRow: 'span 2', aspectRatio: 'auto' },
  wide: { gridColumn: 'span 2', aspectRatio: '3/2' },
}

export function GalleryItem({ item }: GalleryItemProps) {
  return (
    <div
      className="relative overflow-hidden cursor-pointer group"
      style={variantStyles[item.variant]}
    >
      <img
        src={item.img}
        alt={item.alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.06]"
        style={{
          objectPosition: item.imgPosition ?? 'center',
          filter: 'brightness(0.85)',
          transitionTimingFunction: 'var(--pl-ease-out)',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLImageElement).style.filter = 'brightness(1)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLImageElement).style.filter = 'brightness(0.85)'
        }}
      />

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(transparent 50%, rgba(10,10,10,0.8))',
          transitionTimingFunction: 'var(--pl-ease-out)',
        }}
      >
        <h3 className="font-display text-base font-bold text-pl-white uppercase tracking-[0.04em]">
          {item.name}
        </h3>
        <div className="text-[12px] text-pl-accent font-medium mt-1 font-body">{item.price}</div>
        <div className="text-[10px] tracking-[0.08em] uppercase text-pl-white/50 font-body">
          {item.priceArs}
        </div>
      </div>
    </div>
  )
}
