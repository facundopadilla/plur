import { Circle } from 'lucide-react'
import { MARQUEE_ITEMS } from '../data/marquee-items'

// Items are duplicated for the seamless infinite loop (track translates -50%)
const ALL_ITEMS = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

export function MarqueeStrip() {
  return (
    <div
      className="relative overflow-hidden bg-pl-black border-t border-b border-pl-gray-600 py-5"
      aria-hidden="true"
    >
      <div className="marquee-track">
        {ALL_ITEMS.map((item, index) => (
          <span
            key={index}
            className="font-display text-[clamp(14px,1.5vw,20px)] font-bold tracking-[0.06em] uppercase whitespace-nowrap text-pl-white/30"
          >
            {item}
            <Circle className="w-2 h-2 fill-current text-pl-accent inline mx-2" />
          </span>
        ))}
      </div>
    </div>
  )
}
