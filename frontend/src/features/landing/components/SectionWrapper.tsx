import { cn } from '@/lib/utils'

interface SectionWrapperProps {
  children: React.ReactNode
  theme?: 'dark' | 'light' | 'mid'
  counter?: string
  className?: string
  id?: string
}

const themeClasses = {
  dark: 'bg-pl-black text-pl-white',
  light: 'bg-pl-white text-pl-black',
  mid: 'bg-pl-gray-700 text-pl-white',
} as const

export function SectionWrapper({
  children,
  theme = 'dark',
  counter,
  className,
  id,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={cn(
        'relative',
        'px-[clamp(24px,5vw,80px)] py-[clamp(80px,10vw,160px)]',
        themeClasses[theme],
        className,
      )}
    >
      {counter !== undefined && (
        <span className="absolute top-[clamp(24px,4vw,60px)] right-[clamp(24px,5vw,80px)] text-[11px] tracking-[0.1em] opacity-30 font-body">
          {counter}
        </span>
      )}
      {children}
    </section>
  )
}
