import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { RevealOnScroll } from './RevealOnScroll'

const STEPS = [
  { num: '01', titleKey: 'step1Title', descKey: 'step1Desc' },
  { num: '02', titleKey: 'step2Title', descKey: 'step2Desc' },
  { num: '03', titleKey: 'step3Title', descKey: 'step3Desc' },
] as const

export function AIFittingRoom() {
  const { t } = useTranslation()

  return (
    <section id="fitting" className="grid grid-cols-1 lg:grid-cols-2 min-h-screen bg-pl-white overflow-hidden">
      {/* Left: Info */}
      <div className="relative z-10 flex flex-col justify-center px-[clamp(24px,5vw,80px)] py-[clamp(80px,10vw,160px)]">
        <RevealOnScroll>
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-pl-gray-400 mb-4 block font-body">
            {t('landing.fitting.eyebrow')}
          </span>
          <h2 className="font-display text-[clamp(1.8rem,5vw,5rem)] font-extrabold tracking-[-0.05em] leading-[0.95] uppercase text-pl-black mb-6">
            {t('landing.fitting.titleLine1')}
            <br />
            {t('landing.fitting.titleLine2')}
            <br />
            {t('landing.fitting.titleLine3')}
            <span className="text-pl-accent-dim">.</span>
          </h2>
          <p className="text-[clamp(14px,1.1vw,17px)] font-light leading-[1.7] text-pl-black/60 max-w-[480px] font-body">
            {t('landing.fitting.description')}
          </p>
        </RevealOnScroll>

        {/* Steps */}
        <div className="flex flex-col gap-10 mt-12">
          {STEPS.map(({ num, titleKey, descKey }, i) => (
            <RevealOnScroll key={titleKey} delay={((i + 1) as 1 | 2 | 3)}>
              <div className="flex gap-6 items-start">
                <span className="font-display text-3xl font-extrabold text-pl-accent shrink-0 w-12 min-w-[48px]">
                  {num}
                </span>
                <div>
                  <h4 className="font-display text-[15px] font-bold text-pl-black uppercase tracking-[0.04em]">
                    {t(`landing.fitting.${titleKey}`)}
                  </h4>
                  <p className="text-[13px] font-light text-pl-black/55 mt-1 font-body">
                    {t(`landing.fitting.${descKey}`)}
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>

      {/* Right: Before/After images */}
      <div className="relative overflow-hidden min-h-[500px] lg:min-h-0">
        <div className="grid grid-cols-2 h-full">
          {/* Original photo */}
          <div className="relative overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80"
              alt={t('landing.fitting.labelOriginal')}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
              loading="lazy"
            />
            <span
              className="absolute bottom-4 left-4 text-[10px] font-medium tracking-[0.14em] uppercase text-pl-white font-body px-3 py-2"
              style={{ background: 'rgba(10,10,10,0.7)', backdropFilter: 'blur(10px)' }}
            >
              {t('landing.fitting.labelOriginal')}
            </span>
          </div>

          {/* AI result */}
          <div className="relative overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80"
              alt={t('landing.fitting.labelResult')}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
              loading="lazy"
            />
            <span
              className="absolute bottom-4 left-4 text-[10px] font-medium tracking-[0.14em] uppercase text-pl-white font-body px-3 py-2"
              style={{ background: 'rgba(10,10,10,0.7)', backdropFilter: 'blur(10px)' }}
            >
              {t('landing.fitting.labelResult')}
            </span>
          </div>
        </div>

        {/* Center arrow */}
        <div
          className="absolute top-1/2 left-1/2 z-10 flex items-center justify-center text-pl-black bg-pl-accent"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'arrowPulse 2s ease-in-out infinite',
            boxShadow: '0 8px 30px rgba(200,255,0,0.4)',
          }}
          aria-hidden="true"
        >
          <ArrowRight className="w-6 h-6" />
        </div>
      </div>
    </section>
  )
}
