import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex bg-pl-black">
      {/* Panel izquierdo — branding */}
      <div className="hidden md:flex md:w-[45%] relative flex-col">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.3) contrast(1.1)' }}
          />
        </div>
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.5) 50%, rgba(10,10,10,0.85) 100%)',
          }}
        />
        {/* Grain overlay */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px',
            opacity: 0.6,
          }}
        />

        {/* Contenido del panel izquierdo */}
        <div className="relative z-[3] flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <Link
            to="/"
            className="font-display text-xl font-extrabold uppercase tracking-[-0.02em] text-pl-white no-underline"
          >
            {t('landing.nav.brand')}
            <span className="text-pl-accent">.</span>
          </Link>

          {/* Centro — tagline */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-pl-accent mb-5 font-body">
              {t('landing.hero.eyebrow')}
            </p>
            <h2 className="font-display text-[clamp(2.2rem,3.5vw,3.5rem)] font-extrabold tracking-[-0.05em] leading-[0.95] uppercase text-pl-white mb-6">
              {t('landing.cta.titleLine1')}
              <br />
              {t('landing.cta.titleLine2')}
              <br />
              <span className="text-pl-accent">{t('landing.cta.titleLine3')}</span>
            </h2>
            <p className="text-[13px] font-light leading-[1.7] text-pl-white/50 max-w-[320px] font-body">
              {t('landing.cta.description')}
            </p>
          </div>

          {/* Footer del panel */}
          <div className="text-[10px] tracking-[0.1em] uppercase text-pl-white/20 font-body">
            {t('landing.footer.copyright')}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 md:w-[55%] bg-pl-gray-700 flex flex-col">
        {/* Header mobile */}
        <div className="md:hidden px-6 py-5 border-b border-pl-gray-600">
          <Link
            to="/"
            className="font-display text-xl font-extrabold uppercase tracking-[-0.02em] text-pl-white no-underline"
          >
            {t('landing.nav.brand')}
            <span className="text-pl-accent">.</span>
          </Link>
        </div>

        {/* Contenido del formulario */}
        <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-16 overflow-y-auto">
          <div className="w-full max-w-[440px] mx-auto">
            {/* Título de la vista */}
            <div className="mb-10">
              <h1 className="font-display text-[clamp(1.8rem,3vw,2.8rem)] font-extrabold tracking-[-0.04em] leading-[0.95] uppercase text-pl-white mb-3">
                {title}
                <span className="text-pl-accent">.</span>
              </h1>
              {subtitle && (
                <p className="text-[14px] font-light leading-[1.6] text-pl-white/50 font-body">
                  {subtitle}
                </p>
              )}
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
