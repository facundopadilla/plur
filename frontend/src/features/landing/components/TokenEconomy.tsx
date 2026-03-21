import { ArrowRight, RefreshCw, Shirt, Sparkles, TrendingUp, Upload, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SectionWrapper } from './SectionWrapper'
import { RevealOnScroll } from './RevealOnScroll'

const CARD_KEYS: { icon: LucideIcon; titleKey: string; descKey: string; valueKey: string }[] = [
  { icon: Upload, titleKey: 'card1Title', descKey: 'card1Desc', valueKey: 'card1Value' },
  { icon: RefreshCw, titleKey: 'card2Title', descKey: 'card2Desc', valueKey: 'card2Value' },
  { icon: TrendingUp, titleKey: 'card3Title', descKey: 'card3Desc', valueKey: 'card3Value' },
]

export function TokenEconomy() {
  const { t } = useTranslation()

  return (
    <SectionWrapper id="tokens" theme="mid" counter={t('landing.tokens.counter')}>
      <RevealOnScroll>
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-pl-accent mb-4 font-body">
          {t('landing.tokens.eyebrow')}
        </p>
        <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] font-extrabold tracking-[-0.05em] leading-[0.95] uppercase text-pl-white mb-6">
          {t('landing.tokens.titleLine1')}
          <br />
          {t('landing.tokens.titleLine2')}
          <span className="text-pl-accent">.</span>
        </h2>
        <p className="text-[clamp(14px,1.1vw,17px)] font-light leading-[1.7] text-pl-white/60 max-w-[560px] font-body">
          {t('landing.tokens.description')}
        </p>
      </RevealOnScroll>

      {/* Token cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0.5 mt-16">
        {CARD_KEYS.map(({ icon: Icon, titleKey, descKey, valueKey }, i) => (
          <RevealOnScroll key={titleKey} delay={((i + 1) as 1 | 2 | 3)}>
            <div
              className="group bg-pl-gray-600 p-[clamp(32px,3vw,56px)] transition-colors duration-500 cursor-default"
              style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#505050'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#303030'
              }}
            >
              <div className="mb-4"><Icon className="w-9 h-9 text-pl-accent" /></div>
              <h3 className="font-display text-[clamp(18px,1.5vw,24px)] font-bold text-pl-white uppercase tracking-[0.04em] mb-3">
                {t(`landing.tokens.${titleKey}`)}
              </h3>
              <p className="text-[13px] font-light text-pl-white/50 leading-[1.6] font-body">
                {t(`landing.tokens.${descKey}`)}
              </p>
              <div className="font-display text-[clamp(3rem,4vw,5rem)] font-extrabold text-pl-accent/20 mt-8 leading-none">
                {t(`landing.tokens.${valueKey}`)}
              </div>
            </div>
          </RevealOnScroll>
        ))}
      </div>

      {/* Exchange visualization */}
      <RevealOnScroll delay={4}>
        <div
          className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center mt-20 p-12"
          style={{ border: '1px solid #303030' }}
        >
          {/* From */}
          <div className="text-center md:text-left">
            <div className="mb-3"><Shirt className="w-9 h-9 text-pl-white mx-auto md:mx-0" /></div>
            <div className="font-display text-xl font-bold text-pl-white uppercase tracking-[0.04em]">
              {t('landing.tokens.exchangeFromLabel')}
            </div>
            <div className="text-[13px] font-light text-pl-white/40 mt-1 font-body">
              {t('landing.tokens.exchangeFromDesc')}
            </div>
          </div>

          {/* Arrow */}
          <div
            className="text-pl-accent flex justify-center"
            style={{ animation: 'arrowBounce 1.5s ease-in-out infinite' }}
            aria-hidden="true"
          >
            <ArrowRight className="w-8 h-8" />
          </div>

          {/* To */}
          <div className="text-center md:text-right">
            <div className="mb-3"><Sparkles className="w-9 h-9 text-pl-white mx-auto md:ml-auto md:mr-0" /></div>
            <div className="font-display text-xl font-bold text-pl-white uppercase tracking-[0.04em]">
              {t('landing.tokens.exchangeToLabel')}
            </div>
            <div className="text-[13px] font-light text-pl-white/40 mt-1 font-body">
              {t('landing.tokens.exchangeToDesc')}
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </SectionWrapper>
  )
}
