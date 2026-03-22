import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavVisibility } from '../hooks/useNavVisibility'

const NAV_LINKS = [
  { key: 'match', href: '#match' },
  { key: 'aiFitting', href: '#fitting' },
  { key: 'tokens', href: '#tokens' },
  { key: 'collection', href: '#collection' },
] as const

export function Navbar() {
  const { t, i18n } = useTranslation()
  const toggleLang = () => {
    void i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')
  }
  const navigate = useNavigate()
  const { isHidden } = useNavVisibility()

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-[1000]',
        'flex items-center justify-between',
        'px-8 py-5',
        'bg-[rgba(10,10,10,0.6)] backdrop-blur-xl',
        'border-b border-[rgba(245,245,245,0.06)]',
        'transition-transform duration-500',
        isHidden ? '-translate-y-full' : 'translate-y-0',
      )}
      style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
    >
      {/* Logo */}
      <a
        href="/"
        className="font-display text-xl font-extrabold uppercase tracking-[-0.02em] text-pl-white"
      >
        {t('landing.nav.brand')}
        <span className="text-pl-accent">.</span>
      </a>

      {/* Links */}
      <ul className="hidden md:flex items-center gap-10 list-none m-0 p-0">
        {NAV_LINKS.map(({ key, href }) => (
          <li key={key}>
            <a
              href={href}
              className="text-[11px] font-normal tracking-[0.1em] uppercase text-pl-white opacity-60 hover:opacity-100 transition-opacity duration-300 no-underline"
            >
              {t(`landing.nav.${key}`)}
            </a>
          </li>
        ))}
      </ul>

      {/* Right side */}
      <div className="flex items-center gap-5">
        <div className="hidden md:flex items-center gap-2 text-[11px] font-medium text-pl-accent">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4 shrink-0"
            aria-hidden="true"
          >
            <circle cx={12} cy={12} r={10} />
            <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" />
          </svg>
          {t('landing.nav.tokenBalance')}
        </div>
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-pl-white/60 hover:text-pl-white transition-colors cursor-pointer bg-transparent border-0"
          aria-label="Toggle language"
        >
          <Globe className="w-3.5 h-3.5" />
          {i18n.language === 'es' ? 'EN' : 'ES'}
        </button>
        <button
          onClick={() => void navigate('/login')}
          className="text-[10px] font-semibold tracking-[0.12em] uppercase px-6 py-2.5 bg-pl-accent text-pl-black cursor-pointer border-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(200,255,0,0.3)]"
          style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
        >
          {t('landing.nav.joinPlur')}
        </button>
      </div>
    </nav>
  )
}
