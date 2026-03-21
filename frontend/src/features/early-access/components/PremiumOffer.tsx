import { useTranslation } from 'react-i18next'
import { Infinity, Sparkles, ShieldCheck, Zap } from 'lucide-react'
import { SectionWrapper } from '@/features/landing/components/SectionWrapper'
import { RevealOnScroll } from '@/features/landing/components/RevealOnScroll'

const FEATURES = [
  { icon: Infinity, key: 'unlimitedMatches' },
  { icon: Sparkles, key: 'aiFitting' },
  { icon: ShieldCheck, key: 'noFees' },
  { icon: Zap, key: 'priority' },
] as const

export function PremiumOffer() {
  const { t } = useTranslation()

  const scrollToForm = () => {
    document.getElementById('signup-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <SectionWrapper theme="mid">
      <div className="max-w-[700px] mx-auto text-center">
        <RevealOnScroll>
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-pl-accent mb-6 font-body">
            {t('earlyAccess.premium.eyebrow')}
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold tracking-[-0.05em] leading-[0.95] uppercase mb-4 text-pl-white">
            {t('earlyAccess.premium.titleLine1')}
            <br />
            <span className="text-pl-accent">{t('earlyAccess.premium.titleLine2')}</span>
          </h2>
          <p className="text-[clamp(14px,1.1vw,17px)] font-light leading-[1.7] text-pl-white/50 mb-12 font-body">
            {t('earlyAccess.premium.description')}
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-12">
          {FEATURES.map(({ icon: Icon, key }, i) => (
            <RevealOnScroll key={key} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
              <div className="flex flex-col items-center gap-3 p-6 border border-pl-gray-600 bg-pl-gray-700/50">
                <Icon className="w-6 h-6 text-pl-accent" />
                <span className="text-[12px] md:text-[13px] font-medium text-pl-white/80 font-body text-center">
                  {t(`earlyAccess.premium.features.${key}`)}
                </span>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll>
          <button
            onClick={scrollToForm}
            className="text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)]"
            style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
          >
            {t('earlyAccess.premium.cta')}
          </button>
        </RevealOnScroll>
      </div>
    </SectionWrapper>
  )
}
