import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { COLOR_OPTIONS } from '../data/colors'
import type { OnboardingFormData } from '../types'

interface OnboardingStepColorsProps {
  data: OnboardingFormData
  onUpdate: (partial: Partial<OnboardingFormData>) => void
  onNext: () => void
  onBack: () => void
}

export function OnboardingStepColors({ data, onUpdate, onNext, onBack }: OnboardingStepColorsProps) {
  const { t } = useTranslation()

  const toggle = (id: string) => {
    const current = data.selectedColors
    const updated = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id]
    onUpdate({ selectedColors: updated })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-[-0.04em] uppercase text-pl-white leading-[0.95] mb-2">
          {t('onboarding.colors.title')}
          <span className="text-pl-accent">.</span>
        </h2>
        <p className="text-[13px] font-light text-pl-white/50 font-body">
          {t('onboarding.colors.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {COLOR_OPTIONS.map((color) => {
          const isSelected = data.selectedColors.includes(color.id)
          const isLight = ['blanco', 'beige', 'amarillo'].includes(color.id)
          return (
            <button
              key={color.id}
              type="button"
              onClick={() => toggle(color.id)}
              className={cn(
                'flex flex-col items-center gap-2.5 p-3 border cursor-pointer transition-all duration-200 group',
                'bg-pl-gray-700',
                isSelected
                  ? 'border-pl-accent'
                  : 'border-pl-gray-500 hover:border-pl-gray-400',
              )}
              style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
            >
              <div className="relative">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full transition-all duration-200',
                    isSelected ? 'ring-2 ring-pl-accent ring-offset-2 ring-offset-pl-gray-700' : '',
                    isLight ? 'ring-1 ring-pl-gray-500' : '',
                  )}
                  style={{ backgroundColor: color.hex }}
                />
                {isSelected && (
                  <div
                    className="absolute inset-0 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color.hex}cc` }}
                  >
                    <Check className={cn('w-4 h-4', isLight ? 'text-pl-black' : 'text-white')} />
                  </div>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium tracking-[0.1em] uppercase font-body transition-colors duration-150',
                  isSelected ? 'text-pl-accent' : 'text-pl-white/50',
                )}
              >
                {t(color.labelKey)}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-transparent text-pl-white/60 font-body cursor-pointer border border-pl-gray-500 transition-all duration-300 hover:border-pl-gray-300 hover:text-pl-white"
          style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
        >
          {t('onboarding.previous')}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-[2] text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)]"
          style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
        >
          {t('onboarding.next')}
        </button>
      </div>
    </div>
  )
}
