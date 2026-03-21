import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const STATS = [
  { value: '12', unit: 'K', labelKey: 'garments' },
  { value: '4.2', unit: 'K', labelKey: 'users' },
  { value: '98', unit: '%', labelKey: 'satisfaction' },
] as const

export function Hero() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className="relative flex items-center min-h-screen overflow-hidden bg-pl-black">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=80"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
          style={{
            filter: 'brightness(0.3) contrast(1.1)',
            animation: 'heroZoom 20s ease-in-out alternate infinite',
          }}
        />
      </div>

      {/* Overlay gradient */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.9) 80%, #0A0A0A 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-[2] w-full px-[clamp(24px,5vw,80px)] max-w-[900px]">
        <p
          className="anim-fade-up anim-delay-1 text-[11px] font-medium tracking-[0.2em] uppercase text-pl-accent mb-6 font-body"
        >
          {t('landing.hero.eyebrow')}
        </p>

        <h1
          className="anim-fade-up anim-delay-2 font-display text-[clamp(3.5rem,7vw,8rem)] font-extrabold tracking-[-0.05em] leading-[0.92] uppercase mb-8 text-pl-white"
        >
          {t('landing.hero.titleMain')}
          <span className="text-pl-accent">.</span>
          <br />
          <span className="block font-light italic text-[0.65em] tracking-[-0.02em] text-pl-gray-200 normal-case">
            {t('landing.hero.titleItalic')}
          </span>
        </h1>

        <p
          className="anim-fade-up anim-delay-3 text-[clamp(14px,1.2vw,18px)] font-light leading-[1.7] max-w-[520px] text-pl-white/60 mb-10 font-body"
        >
          {t('landing.hero.description')}
        </p>

        <div className="anim-fade-up anim-delay-4 flex flex-wrap gap-4">
          <button
            onClick={() => void navigate('/login')}
            className="text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)]"
            style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
          >
            {t('landing.hero.ctaPrimary')}
          </button>
          <button
            onClick={() => {
              document.getElementById('match')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 border border-pl-white/20 text-pl-white font-body cursor-pointer bg-transparent transition-all duration-300 hover:border-pl-white hover:bg-pl-white/5 hover:-translate-y-1"
            style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
          >
            {t('landing.hero.ctaSecondary')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="anim-fade-up anim-delay-5 hidden lg:flex absolute bottom-[60px] right-[clamp(24px,5vw,80px)] z-[2] gap-12">
        {STATS.map(({ value, unit, labelKey }) => (
          <div key={labelKey} className="text-right">
            <div className="font-display text-[clamp(2rem,3vw,3.5rem)] font-extrabold leading-none text-pl-white">
              {value}
              <span className="text-pl-accent">{unit}</span>
            </div>
            <div className="text-[10px] tracking-[0.14em] uppercase text-pl-white/40 mt-1 font-body">
              {t(`landing.hero.stats.${labelKey}`)}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2] flex flex-col items-center gap-3">
        <span className="text-[9px] tracking-[0.2em] uppercase text-pl-white/30 font-body">
          {t('landing.hero.scroll')}
        </span>
        <div
          className="w-px h-10 bg-pl-white/20"
          style={{ animation: 'scrollPulse 2s ease-in-out infinite' }}
        />
      </div>
    </section>
  )
}
