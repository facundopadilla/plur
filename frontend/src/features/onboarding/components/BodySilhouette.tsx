import { cn } from '@/lib/utils'

interface BodySilhouetteProps {
  className?: string
}

export function BodySilhouette({ className }: BodySilhouetteProps) {
  return (
    <svg
      viewBox="0 0 120 300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('text-pl-gray-400', className)}
      aria-hidden="true"
    >
      {/* Head */}
      <ellipse cx="60" cy="22" rx="14" ry="16" />

      {/* Neck */}
      <line x1="53" y1="37" x2="50" y2="48" />
      <line x1="67" y1="37" x2="70" y2="48" />

      {/* Shoulders */}
      <path d="M50 48 C40 48, 28 52, 24 62" />
      <path d="M70 48 C80 48, 92 52, 96 62" />

      {/* Left arm */}
      <path d="M24 62 C20 72, 18 85, 20 98 C21 104, 24 110, 22 118" />
      <ellipse cx="21" cy="121" rx="4" ry="3.5" />

      {/* Right arm */}
      <path d="M96 62 C100 72, 102 85, 100 98 C99 104, 96 110, 98 118" />
      <ellipse cx="99" cy="121" rx="4" ry="3.5" />

      {/* Torso */}
      <path d="M50 48 L46 130 L74 130 L70 48" />

      {/* Waist / hips */}
      <path d="M46 130 C42 140, 38 148, 40 158 C42 166, 48 172, 50 178" />
      <path d="M74 130 C78 140, 82 148, 80 158 C78 166, 72 172, 70 178" />

      {/* Crotch */}
      <path d="M50 178 C54 182, 60 184, 60 184 C60 184, 66 182, 70 178" />

      {/* Left leg */}
      <path d="M50 178 L46 220 L44 262" />
      <path d="M44 262 C43 270, 42 278, 44 284" />
      <path d="M44 284 C42 288, 36 290, 30 289" strokeWidth="1.5" />
      <path d="M44 284 C44 288, 50 292, 56 290" strokeWidth="1.5" />

      {/* Right leg */}
      <path d="M70 178 L74 220 L76 262" />
      <path d="M76 262 C77 270, 78 278, 76 284" />
      <path d="M76 284 C78 288, 84 290, 90 289" strokeWidth="1.5" />
      <path d="M76 284 C76 288, 70 292, 64 290" strokeWidth="1.5" />

      {/* Indicator dots */}
      {/* Chest indicator ~y:90 */}
      <circle cx="60" cy="90" r="2.5" fill="currentColor" className="text-pl-accent" stroke="none" />
      {/* Hip indicator ~y:155 */}
      <circle cx="60" cy="155" r="2.5" fill="currentColor" className="text-pl-accent" stroke="none" />
      {/* Feet indicator ~y:285 */}
      <circle cx="60" cy="285" r="2.5" fill="currentColor" className="text-pl-accent" stroke="none" />
    </svg>
  )
}
