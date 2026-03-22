import { MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { DashboardGarment } from '../types'
import { useDashboardStore } from '@/stores/dashboard.store'
import { getCurrency, formatFiatPrice } from '../data/currencies'

interface GarmentInfoProps {
  garment: DashboardGarment
}

export function GarmentInfo({ garment }: GarmentInfoProps) {
  const selectedCurrency = useDashboardStore((s) => s.selectedCurrency)
  const currency = getCurrency(selectedCurrency)

  return (
    <div
      className="absolute inset-x-0 bottom-0 px-4 pt-16 pb-[calc(100px+env(safe-area-inset-bottom))] lg:pb-24 z-10"
      style={{ background: 'linear-gradient(transparent 0%, rgba(10,10,10,0.85) 35%, rgba(10,10,10,0.98) 100%)' }}
    >
      {/* Dual price */}
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-[15px] font-bold text-pl-white font-body">
          {formatFiatPrice(garment.pricePLR, currency)}
        </span>
        <span className="text-[12px] text-pl-accent font-body font-semibold tracking-[0.08em]">
          {garment.pricePLR} PLR
        </span>
      </div>

      {/* Name */}
      <h3 className="font-display text-lg font-extrabold text-pl-white uppercase tracking-[-0.02em] leading-tight">
        {garment.name}
      </h3>

      {/* Description */}
      <p className="text-[11px] text-pl-gray-300 mt-1 mb-2 font-body leading-relaxed line-clamp-2">
        {garment.description}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[10px] text-pl-gray-300 font-body tracking-[0.06em] uppercase">
          Talle {garment.size}
        </span>
        <span className="w-px h-3 bg-pl-gray-500" />
        <span className="text-[10px] text-pl-gray-300 font-body tracking-[0.06em] uppercase">
          {garment.condition}
        </span>
        <span className="w-px h-3 bg-pl-gray-500" />
        <span className="flex items-center gap-1 text-[10px] text-pl-gray-300 font-body">
          <MapPin className="w-3 h-3" />
          {garment.location}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant="secondary"
          className="text-[9px] font-body tracking-[0.08em] uppercase bg-white/10 text-pl-gray-200 border-white/10 hover:bg-white/15 px-2 py-0.5 backdrop-blur-sm"
        >
          {garment.style}
        </Badge>
        {garment.tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="text-[9px] font-body tracking-[0.08em] uppercase border-white/15 text-pl-gray-300 hover:text-pl-white px-2 py-0.5"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}
