import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useNavVisibility } from '@/features/landing/hooks/useNavVisibility'

export function EarlyAccessNavbar() {
  const { t } = useTranslation()
  const { isHidden } = useNavVisibility()

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-[1000]',
        'flex items-center justify-between',
        'px-6 py-4 md:px-8 md:py-5',
        'bg-[rgba(10,10,10,0.6)] backdrop-blur-xl',
        'border-b border-[rgba(245,245,245,0.06)]',
        'transition-transform duration-500',
        isHidden ? '-translate-y-full' : 'translate-y-0',
      )}
      style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
    >
      <a
        href="/"
        className="font-display text-xl font-extrabold uppercase tracking-[-0.02em] text-pl-white"
      >
        {t('landing.nav.brand')}
        <span className="text-pl-accent">.</span>
      </a>

      <span className="text-[9px] md:text-[10px] font-semibold tracking-[0.14em] uppercase px-3 py-1.5 bg-pl-accent text-pl-black">
        {t('earlyAccess.nav.badge')}
      </span>
    </nav>
  )
}
