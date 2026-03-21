import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  currentStep: number
  labels: string[]
}

export function StepIndicator({ currentStep, labels }: StepIndicatorProps) {
  return (
    <div className="flex gap-2 mb-10">
      {labels.map((label, i) => (
        <div key={label} className="flex-1 flex flex-col gap-2">
          <div
            className={cn(
              'h-0.5 transition-all duration-500',
              i <= currentStep ? 'bg-pl-accent' : 'bg-pl-gray-500',
            )}
            style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
          />
          <span
            className={cn(
              'text-[9px] font-medium tracking-[0.15em] uppercase font-body transition-colors duration-300',
              i <= currentStep ? 'text-pl-accent' : 'text-pl-white/30',
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
