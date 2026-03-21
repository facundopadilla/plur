import {
  Shirt, Flame, Briefcase, Dumbbell, Clock, Sun,
  Minus, Building2, Crown, Zap, Heart, Music,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { LucideProps } from 'lucide-react'
import { SelectableCard } from './SelectableCard'
import { STYLE_OPTIONS } from '../data/styles'
import type { OnboardingFormData } from '../types'

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Shirt, Flame, Briefcase, Dumbbell, Clock, Sun,
  Minus, Building2, Crown, Zap, Heart, Music,
}

interface OnboardingStepStylesProps {
  data: OnboardingFormData
  onUpdate: (partial: Partial<OnboardingFormData>) => void
  onNext: () => void
}

export function OnboardingStepStyles({ data, onUpdate, onNext }: OnboardingStepStylesProps) {
  const { t } = useTranslation()

  const toggle = (id: string) => {
    const current = data.selectedStyles
    const updated = current.includes(id)
      ? current.filter((s) => s !== id)
      : [...current, id]
    onUpdate({ selectedStyles: updated })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-[-0.04em] uppercase text-pl-white leading-[0.95] mb-2">
          {t('onboarding.styles.title')}
          <span className="text-pl-accent">.</span>
        </h2>
        <p className="text-[13px] font-light text-pl-white/50 font-body">
          {t('onboarding.styles.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {STYLE_OPTIONS.map((style) => {
          const Icon = ICON_MAP[style.icon]
          const isSelected = data.selectedStyles.includes(style.id)
          return (
            <SelectableCard
              key={style.id}
              selected={isSelected}
              onToggle={() => toggle(style.id)}
            >
              {Icon && (
                <Icon
                  className={isSelected ? 'text-pl-accent w-5 h-5' : 'text-pl-white/40 w-5 h-5'}
                />
              )}
              <span
                className={`text-[11px] font-medium tracking-[0.08em] uppercase font-body text-center transition-colors duration-150 ${
                  isSelected ? 'text-pl-accent' : 'text-pl-white/70'
                }`}
              >
                {t(style.labelKey)}
              </span>
            </SelectableCard>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)]"
        style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
      >
        {t('onboarding.next')}
      </button>
    </div>
  )
}
