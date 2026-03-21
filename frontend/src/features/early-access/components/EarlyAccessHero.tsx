import { useTranslation } from 'react-i18next'
import { ArrowDown } from 'lucide-react'

export function EarlyAccessHero() {
  const { t } = useTranslation()

  const scrollToForm = () => {
    document.getElementById('signup-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative flex items-center justify-center min-h-screen overflow-hidden bg-pl-black">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
          style={{
            filter: 'brightness(0.25) contrast(1.1) saturate(0.8)',
            animation: 'heroZoom 20s ease-in-out alternate infinite',
          }}
        />
      </div>

      {/* Overlay gradient */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0.85) 70%, #0A0A0A 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-[2] w-full px-6 md:px-[clamp(24px,5vw,80px)] max-w-[800px] text-center">
        <p className="anim-fade-up anim-delay-1 text-[10px] md:text-[11px] font-medium tracking-[0.2em] uppercase text-pl-accent mb-6 font-body">
          {t('earlyAccess.hero.eyebrow')}
        </p>

        <h1 className="anim-fade-up anim-delay-2 font-display text-[clamp(2.5rem,7vw,6rem)] font-extrabold tracking-[-0.05em] leading-[0.92] uppercase mb-6 text-pl-white">
          {t('earlyAccess.hero.titleLine1')}
          <br />
          <span className="text-pl-accent">{t('earlyAccess.hero.titleLine2')}</span>
        </h1>

        <p className="anim-fade-up anim-delay-3 text-[clamp(14px,1.2vw,18px)] font-light leading-[1.7] max-w-[520px] mx-auto text-pl-white/60 mb-10 font-body">
          {t('earlyAccess.hero.description')}
        </p>

        <button
          onClick={scrollToForm}
          className="anim-fade-up anim-delay-4 text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)]"
          style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
        >
          {t('earlyAccess.hero.cta')}
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2] flex flex-col items-center gap-2">
        <ArrowDown
          className="w-4 h-4 text-pl-white/30"
          style={{ animation: 'scrollPulse 2s ease-in-out infinite' }}
        />
      </div>
    </section>
  )
}
