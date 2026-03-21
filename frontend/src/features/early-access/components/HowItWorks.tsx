import { useTranslation } from 'react-i18next'
import { Camera, Heart, ArrowLeftRight } from 'lucide-react'
import { SectionWrapper } from '@/features/landing/components/SectionWrapper'
import { RevealOnScroll } from '@/features/landing/components/RevealOnScroll'

const STEPS = [
  { icon: Camera, key: 'step1', number: '01' },
  { icon: Heart, key: 'step2', number: '02' },
  { icon: ArrowLeftRight, key: 'step3', number: '03' },
] as const

export function HowItWorks() {
  const { t } = useTranslation()

  return (
    <SectionWrapper theme="light" id="how-it-works">
      <RevealOnScroll>
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-pl-accent-dim mb-4 font-body">
          {t('earlyAccess.howItWorks.eyebrow')}
        </p>
        <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold tracking-[-0.05em] leading-[0.95] uppercase mb-16 text-pl-black">
          {t('earlyAccess.howItWorks.titleLine1')}
          <br />
          <span className="text-pl-gray-400">{t('earlyAccess.howItWorks.titleLine2')}</span>
        </h2>
      </RevealOnScroll>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {STEPS.map(({ icon: Icon, key, number }, i) => (
          <RevealOnScroll key={key} delay={(i + 1) as 1 | 2 | 3}>
            <div className="group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 flex items-center justify-center bg-pl-black">
                  <Icon className="w-6 h-6 text-pl-accent" />
                </div>
                <span className="text-[11px] font-medium tracking-[0.14em] text-pl-gray-300 font-body">
                  {number}
                </span>
              </div>
              <h3 className="font-display text-[clamp(1.25rem,2vw,1.75rem)] font-bold tracking-[-0.02em] mb-3 text-pl-black">
                {t(`earlyAccess.howItWorks.${key}.title`)}
              </h3>
              <p className="text-[clamp(13px,1vw,15px)] font-light leading-[1.7] text-pl-gray-400 font-body">
                {t(`earlyAccess.howItWorks.${key}.description`)}
              </p>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </SectionWrapper>
  )
}
