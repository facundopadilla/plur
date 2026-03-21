import { X, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface SwipeActionsProps {
  onDislike: () => void
  onLike: () => void
  disabled: boolean
}

export function SwipeActions({ onDislike, onLike, disabled }: SwipeActionsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-center gap-8 py-6">
      {/* Dislike */}
      <button
        onClick={onDislike}
        disabled={disabled}
        aria-label={t('dashboard.swipe.btnDislike')}
        className="w-16 h-16 rounded-full border-2 border-pl-red text-pl-red flex items-center justify-center hover:bg-pl-red/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        style={{ transition: 'transform 0.2s var(--pl-ease-spring), background-color 0.2s ease, opacity 0.2s ease' }}
        onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(1.12)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <X className="w-7 h-7" strokeWidth={2.5} />
      </button>

      {/* Like */}
      <button
        onClick={onLike}
        disabled={disabled}
        aria-label={t('dashboard.swipe.btnLike')}
        className="w-16 h-16 rounded-full border-2 border-pl-green text-pl-green flex items-center justify-center hover:bg-pl-green/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        style={{ transition: 'transform 0.2s var(--pl-ease-spring), background-color 0.2s ease, opacity 0.2s ease' }}
        onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(1.12)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <Heart className="w-7 h-7 fill-pl-green" strokeWidth={0} />
      </button>
    </div>
  )
}
