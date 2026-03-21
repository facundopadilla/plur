import { useTranslation } from 'react-i18next'

export function EarlyAccessFooter() {
  const { t } = useTranslation()

  return (
    <footer className="bg-pl-black border-t border-pl-gray-600">
      <div className="px-6 md:px-[clamp(24px,5vw,80px)] py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] tracking-[0.1em] uppercase text-pl-white/25 font-body">
        <span>{t('landing.footer.copyright')}</span>
        <a
          href="/"
          className="text-pl-white/25 hover:text-pl-white/50 transition-colors duration-300 no-underline"
        >
          {t('landing.nav.brand')}
          <span className="text-pl-accent">.</span>
        </a>
      </div>
    </footer>
  )
}
