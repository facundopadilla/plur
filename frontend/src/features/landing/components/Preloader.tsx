import { cn } from '@/lib/utils'
import { usePreloader } from '../hooks/usePreloader'

export function Preloader() {
  const { isVisible } = usePreloader()

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-pl-black',
        'transition-[opacity,visibility] duration-700',
        isVisible ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none',
      )}
      style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
      aria-hidden={!isVisible}
    >
      <div
        className="font-display font-extrabold uppercase tracking-[-0.05em] text-[clamp(3rem,8vw,7rem)]"
        style={{
          background: 'linear-gradient(135deg, #F5F5F5 0%, #C8FF00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'preloaderPulse 1.5s ease-in-out infinite',
        }}
      >
        Plur
      </div>
      <div className="mt-8 h-[2px] w-[200px] bg-pl-gray-600 overflow-hidden">
        <div
          className="h-full bg-pl-accent"
          style={{ animation: 'preloaderFill 2s ease-out forwards', width: '0%' }}
        />
      </div>
    </div>
  )
}
