import { Recycle } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()

  const platformLinks = [
    t('landing.footer.platformLinks.swipe'),
    t('landing.footer.platformLinks.fitting'),
    t('landing.footer.platformLinks.tokens'),
    t('landing.footer.platformLinks.publish'),
  ]

  const communityLinks = [
    t('landing.footer.communityLinks.blog'),
    t('landing.footer.communityLinks.instagram'),
    t('landing.footer.communityLinks.discord'),
    t('landing.footer.communityLinks.ambassadors'),
  ]

  const legalLinks = [
    t('landing.footer.legalLinks.terms'),
    t('landing.footer.legalLinks.privacy'),
    t('landing.footer.legalLinks.shipping'),
    t('landing.footer.legalLinks.sizing'),
  ]

  return (
    <footer className="bg-pl-black border-t border-pl-gray-600">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 px-[clamp(24px,5vw,80px)] py-16">
        {/* Brand */}
        <div>
          <div className="font-display text-xl font-extrabold uppercase tracking-[-0.02em] text-pl-white mb-4">
            {t('landing.nav.brand')}
            <span className="text-pl-accent">.</span>
          </div>
          <p className="text-[13px] font-light leading-[1.7] text-pl-white/50 max-w-[280px] font-body">
            {t('landing.footer.tagline')}
          </p>
        </div>

        {/* Platform */}
        <div>
          <h4 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-pl-white mb-6 font-body">
            {t('landing.footer.platform')}
          </h4>
          <ul className="flex flex-col gap-3 list-none m-0 p-0">
            {platformLinks.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="text-[13px] font-light text-pl-white/50 hover:text-pl-white transition-colors duration-300 no-underline font-body"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Community */}
        <div>
          <h4 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-pl-white mb-6 font-body">
            {t('landing.footer.community')}
          </h4>
          <ul className="flex flex-col gap-3 list-none m-0 p-0">
            {communityLinks.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="text-[13px] font-light text-pl-white/50 hover:text-pl-white transition-colors duration-300 no-underline font-body"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-pl-white mb-6 font-body">
            {t('landing.footer.legal')}
          </h4>
          <ul className="flex flex-col gap-3 list-none m-0 p-0">
            {legalLinks.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="text-[13px] font-light text-pl-white/50 hover:text-pl-white transition-colors duration-300 no-underline font-body"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-pl-gray-600 px-[clamp(24px,5vw,80px)] py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] tracking-[0.1em] uppercase text-pl-white/25 font-body">
        <span>{t('landing.footer.copyright')}</span>
        <span>
          <Trans
            i18nKey="landing.footer.madeWith"
            components={{ icon: <Recycle className="inline w-3 h-3" /> }}
          />
        </span>
      </div>
    </footer>
  )
}
