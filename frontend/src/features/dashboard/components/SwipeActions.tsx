import { X, Heart, Sparkles, Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface SwipeActionsProps {
  onDislike: () => void
  onTryOn: () => void
  onLike: () => void
  onUndo: () => void
  disabled: boolean
  canUndo: boolean
}

function ActionButton({
  onClick,
  disabled,
  ariaLabel,
  className,
  children,
}: {
  onClick: () => void
  disabled: boolean
  ariaLabel: string
  className: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'flex items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function SwipeActions({ onDislike, onTryOn, onLike, onUndo, disabled, canUndo }: SwipeActionsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-center gap-3 lg:gap-4">
      {/* Undo */}
      <ActionButton
        onClick={onUndo}
        disabled={disabled || !canUndo}
        ariaLabel={t('dashboard.swipe.btnUndo', 'Undo')}
        className="w-9 h-9 lg:w-11 lg:h-11 border-2 border-amber-400 text-amber-400 bg-black/40 hover:bg-amber-400/15"
      >
        <Undo2 className="w-5 h-5" />
      </ActionButton>

      {/* Dislike */}
      <ActionButton
        onClick={onDislike}
        disabled={disabled}
        ariaLabel={t('dashboard.swipe.btnDislike')}
        className="w-12 h-12 lg:w-14 lg:h-14 border-2 border-pl-red text-pl-red bg-black/40 hover:bg-pl-red/15"
      >
        <X className="w-7 h-7" strokeWidth={2.5} />
      </ActionButton>

      {/* Try on with AI */}
      <ActionButton
        onClick={onTryOn}
        disabled={disabled}
        ariaLabel={t('dashboard.swipe.btnTryOn')}
        className="w-9 h-9 lg:w-11 lg:h-11 border-2 border-sky-400 text-sky-400 bg-black/40 hover:bg-sky-400/15"
      >
        <Sparkles className="w-5 h-5" />
      </ActionButton>

      {/* Like */}
      <ActionButton
        onClick={onLike}
        disabled={disabled}
        ariaLabel={t('dashboard.swipe.btnLike')}
        className="w-12 h-12 lg:w-14 lg:h-14 border-2 border-pl-green text-pl-green bg-black/40 hover:bg-pl-green/15"
      >
        <Heart className="w-7 h-7 fill-pl-green" strokeWidth={0} />
      </ActionButton>
    </div>
  )
}
