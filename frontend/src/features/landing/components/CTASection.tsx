import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { RevealOnScroll } from './RevealOnScroll'

export function CTASection() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className="bg-pl-black text-pl-white flex flex-col items-center justify-center text-center px-[clamp(24px,5vw,80px)] py-[clamp(120px,15vw,200px)]">
      <RevealOnScroll>
        <h2 className="font-display text-[clamp(3rem,6vw,7rem)] font-extrabold tracking-[-0.06em] leading-[0.92] uppercase mb-8 text-pl-white">
          {t('landing.cta.titleLine1')}
          <br />
          {t('landing.cta.titleLine2')}
          <br />
          <span className="text-pl-accent">{t('landing.cta.titleLine3')}</span>
        </h2>
        <p className="text-[clamp(14px,1.1vw,17px)] font-light leading-[1.7] max-w-[560px] text-pl-white/60 mb-12 mx-auto font-body">
          {t('landing.cta.description')}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => void navigate('/login')}
            className="text-[11px] font-semibold tracking-[0.12em] uppercase px-10 py-5 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)]"
            style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
          >
            {t('landing.cta.ctaPrimary')}
          </button>
          <button
            onClick={() => {
              document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="text-[11px] font-semibold tracking-[0.12em] uppercase px-10 py-5 border border-pl-white/20 text-pl-white font-body cursor-pointer bg-transparent transition-all duration-300 hover:border-pl-white hover:bg-pl-white/5 hover:-translate-y-1"
            style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
          >
            {t('landing.cta.ctaSecondary')}
          </button>
        </div>
      </RevealOnScroll>
    </section>
  )
}
