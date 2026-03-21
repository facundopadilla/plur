import { X, Heart, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface SwipeActionsProps {
  onDislike: () => void
  onTryOn: () => void
  onLike: () => void
  disabled: boolean
}

export function SwipeActions({ onDislike, onTryOn, onLike, disabled }: SwipeActionsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-center gap-6 pt-6 pb-20 lg:pb-6">
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

      {/* Try on with AI */}
      <button
        onClick={onTryOn}
        disabled={disabled}
        aria-label={t('dashboard.swipe.btnTryOn')}
        className="w-12 h-12 rounded-full border-2 border-sky-400 text-sky-400 flex items-center justify-center hover:bg-sky-400/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        style={{ transition: 'transform 0.2s var(--pl-ease-spring), background-color 0.2s ease, opacity 0.2s ease' }}
        onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(1.12)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <Sparkles className="w-5 h-5" />
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
