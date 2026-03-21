import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { useScrollReveal } from '../hooks/useScrollReveal'

interface RevealOnScrollProps {
  children: React.ReactNode
  delay?: 1 | 2 | 3 | 4
  className?: string
}

export function RevealOnScroll({ children, delay, className }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  useScrollReveal(ref)

  return (
    <div
      ref={ref}
      className={cn('reveal', delay !== undefined && `reveal-delay-${delay}`, className)}
    >
      {children}
    </div>
  )
}
