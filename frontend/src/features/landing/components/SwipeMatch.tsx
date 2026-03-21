import { Heart, Package, Target, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SectionWrapper } from './SectionWrapper'
import { RevealOnScroll } from './RevealOnScroll'
import { SwipeCardStack } from './SwipeCardStack'

const FEATURES: { icon: LucideIcon; titleKey: string; descKey: string }[] = [
  { icon: Target, titleKey: 'feature1Title', descKey: 'feature1Desc' },
  { icon: Heart, titleKey: 'feature2Title', descKey: 'feature2Desc' },
  { icon: Package, titleKey: 'feature3Title', descKey: 'feature3Desc' },
]

export function SwipeMatch() {
  const { t } = useTranslation()

  return (
    <SectionWrapper id="match" theme="dark" counter={t('landing.swipe.counter')}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(32px,4vw,80px)] items-center min-h-[80vh]">
        {/* Left: Info */}
        <RevealOnScroll className="max-w-[480px]">
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-pl-accent mb-4 font-body">
            {t('landing.swipe.eyebrow')}
          </p>
          <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] font-extrabold tracking-[-0.05em] leading-[0.95] uppercase text-pl-white mb-6">
            {t('landing.swipe.titleLine1')}
            <br />
            {t('landing.swipe.titleLine2')}
            <span className="text-pl-accent">.</span>
          </h2>
          <p className="text-[clamp(14px,1.1vw,17px)] font-light leading-[1.7] text-pl-white/60 max-w-[560px] font-body">
            {t('landing.swipe.description')}
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-8 mt-12">
            {FEATURES.map(({ icon: Icon, titleKey, descKey }, i) => (
              <RevealOnScroll key={titleKey} delay={((i + 1) as 1 | 2 | 3)}>
                <div className="flex gap-4 items-start">
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid #303030',
                    }}
                  >
                    <Icon className="w-5 h-5 text-pl-accent" />
                  </div>
                  <div>
                    <h4 className="font-display text-[14px] font-bold text-pl-white uppercase tracking-[0.04em]">
                      {t(`landing.swipe.${titleKey}`)}
                    </h4>
                    <p className="text-[12px] font-light text-pl-white/50 mt-1 font-body">
                      {t(`landing.swipe.${descKey}`)}
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </RevealOnScroll>

        {/* Right: Phone mockup */}
        <RevealOnScroll delay={2} className="flex justify-center lg:justify-end">
          <SwipeCardStack />
        </RevealOnScroll>
      </div>
    </SectionWrapper>
  )
}
