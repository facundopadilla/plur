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
      className="absolute inset-x-0 bottom-0 p-5 z-10"
      style={{ background: 'linear-gradient(transparent, rgba(10,10,10,0.95) 60%)' }}
    >
      {/* Dual price */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[14px] font-semibold text-pl-white font-body">
          {formatFiatPrice(garment.pricePLR, currency)}
        </span>
        <span className="text-[11px] text-pl-accent font-body font-semibold tracking-[0.1em]">
          {garment.pricePLR} PLR
        </span>
      </div>

      {/* Name */}
      <h3 className="font-display text-xl font-extrabold text-pl-white uppercase tracking-[-0.02em] leading-tight">
        {garment.name}
      </h3>

      {/* Description */}
      <p className="text-[12px] text-pl-gray-300 mt-1 mb-3 font-body leading-relaxed line-clamp-2">
        {garment.description}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[11px] text-pl-gray-400 font-body tracking-[0.08em] uppercase">
          Talle {garment.size}
        </span>
        <span className="w-px h-3 bg-pl-gray-600" />
        <span className="text-[11px] text-pl-gray-400 font-body tracking-[0.08em] uppercase">
          {garment.condition}
        </span>
        <span className="w-px h-3 bg-pl-gray-600" />
        <span className="flex items-center gap-1 text-[11px] text-pl-gray-400 font-body">
          <MapPin className="w-3 h-3" />
          {garment.location}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant="secondary"
          className="text-[10px] font-body tracking-[0.08em] uppercase bg-pl-gray-700 text-pl-gray-300 border-pl-gray-600 hover:bg-pl-gray-600 px-2 py-0.5"
        >
          {garment.style}
        </Badge>
        {garment.tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="text-[10px] font-body tracking-[0.08em] uppercase border-pl-gray-600 text-pl-gray-400 hover:text-pl-gray-300 px-2 py-0.5"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}
