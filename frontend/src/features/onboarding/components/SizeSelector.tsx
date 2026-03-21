import { cn } from '@/lib/utils'
import type { ClothingSize } from '../types'
import { CLOTHING_SIZES } from '../data/sizes'

interface SizeSelectorProps {
  value: ClothingSize | null
  onChange: (size: ClothingSize) => void
}

export function SizeSelector({ value, onChange }: SizeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CLOTHING_SIZES.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onChange(size)}
          className={cn(
            'min-w-[40px] px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase font-body border cursor-pointer transition-all duration-150',
            value === size
              ? 'bg-pl-accent text-pl-black border-pl-accent'
              : 'bg-pl-gray-700 text-pl-white/70 border-pl-gray-500 hover:border-pl-gray-300 hover:text-pl-white',
          )}
          style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
        >
          {size}
        </button>
      ))}
    </div>
  )
}
