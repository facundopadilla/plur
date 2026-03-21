import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { BodySilhouette } from './BodySilhouette'
import { SizeSelector } from './SizeSelector'
import type { ClothingSize, OnboardingFormData } from '../types'

interface OnboardingStepBodyProps {
  data: OnboardingFormData
  onUpdate: (partial: Partial<OnboardingFormData>) => void
  onBack: () => void
  onFinish: () => void
  finishLabel?: string
}

export function OnboardingStepBody({ data, onUpdate, onBack, onFinish, finishLabel }: OnboardingStepBodyProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-[-0.04em] uppercase text-pl-white leading-[0.95] mb-2">
          {t('onboarding.body.title')}
          <span className="text-pl-accent">.</span>
        </h2>
        <p className="text-[13px] font-light text-pl-white/50 font-body">
          {t('onboarding.body.subtitle')}
        </p>
      </div>

      {/* Desktop: silueta con cards flotantes */}
      <div className="hidden md:flex items-center justify-center">
        <div className="relative w-full max-w-[560px] h-[340px]">
          {/* Silueta centrada */}
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex items-center">
            <BodySilhouette className="h-[320px] w-auto" />
          </div>

          {/* Card flotante izquierda arriba — parte superior */}
          <div className="absolute left-0 top-[8%] w-[200px]">
            <div className="bg-pl-gray-700 border border-pl-gray-500 p-3">
              <p className="text-[9px] font-medium tracking-[0.15em] uppercase text-pl-white/50 font-body mb-2">
                {t('onboarding.body.upperBody')}
              </p>
              <SizeSelector
                value={data.upperBodySize}
                onChange={(size: ClothingSize) => onUpdate({ upperBodySize: size })}
              />
            </div>
            {/* Línea conectora */}
            <div className="absolute top-[50%] right-0 w-8 h-px bg-pl-gray-500 translate-x-full" />
          </div>

          {/* Card flotante derecha medio — parte inferior */}
          <div className="absolute right-0 top-[42%] w-[200px]">
            <div className="bg-pl-gray-700 border border-pl-gray-500 p-3">
              <p className="text-[9px] font-medium tracking-[0.15em] uppercase text-pl-white/50 font-body mb-2">
                {t('onboarding.body.lowerBody')}
              </p>
              <SizeSelector
                value={data.lowerBodySize}
                onChange={(size: ClothingSize) => onUpdate({ lowerBodySize: size })}
              />
            </div>
            {/* Línea conectora */}
            <div className="absolute top-[50%] left-0 w-8 h-px bg-pl-gray-500 -translate-x-full" />
          </div>

          {/* Card flotante izquierda abajo — calzado */}
          <div className="absolute left-0 bottom-[2%] w-[200px]">
            <div className="bg-pl-gray-700 border border-pl-gray-500 p-3">
              <p className="text-[9px] font-medium tracking-[0.15em] uppercase text-pl-white/50 font-body mb-2">
                {t('onboarding.body.shoeSize')}
              </p>
              <Input
                type="number"
                inputMode="numeric"
                value={data.shoeSize}
                onChange={(e) => onUpdate({ shoeSize: e.target.value })}
                placeholder={t('onboarding.body.shoeSizePlaceholder')}
                className={cn(
                  'rounded-none h-9 bg-pl-gray-600 border-pl-gray-500 text-pl-white placeholder:text-pl-gray-400 font-body text-sm',
                  'focus-visible:border-pl-accent focus-visible:ring-1 focus-visible:ring-pl-accent/20',
                )}
              />
            </div>
            {/* Línea conectora */}
            <div className="absolute top-[50%] right-0 w-8 h-px bg-pl-gray-500 translate-x-full" />
          </div>
        </div>
      </div>

      {/* Mobile: layout apilado con silueta decorativa */}
      <div className="flex flex-col gap-6 md:hidden">
        <div className="flex justify-center">
          <BodySilhouette className="h-44 w-auto opacity-60" />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-white/60 font-body">
            {t('onboarding.body.upperBody')}
          </Label>
          <SizeSelector
            value={data.upperBodySize}
            onChange={(size: ClothingSize) => onUpdate({ upperBodySize: size })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-white/60 font-body">
            {t('onboarding.body.lowerBody')}
          </Label>
          <SizeSelector
            value={data.lowerBodySize}
            onChange={(size: ClothingSize) => onUpdate({ lowerBodySize: size })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-white/60 font-body">
            {t('onboarding.body.shoeSize')}
          </Label>
          <Input
            type="number"
            inputMode="numeric"
            value={data.shoeSize}
            onChange={(e) => onUpdate({ shoeSize: e.target.value })}
            placeholder={t('onboarding.body.shoeSizePlaceholder')}
            className={cn(
              'rounded-none h-12 bg-pl-gray-600 border-pl-gray-500 text-pl-white placeholder:text-pl-gray-400 font-body text-sm',
              'focus-visible:border-pl-accent focus-visible:ring-1 focus-visible:ring-pl-accent/20',
            )}
          />
        </div>
      </div>

      {/* Altura y peso — siempre abajo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-white/60 font-body">
            {t('onboarding.body.height')}
          </Label>
          <Input
            type="number"
            inputMode="numeric"
            value={data.heightCm}
            onChange={(e) => onUpdate({ heightCm: e.target.value })}
            placeholder={t('onboarding.body.heightPlaceholder')}
            className={cn(
              'rounded-none h-12 bg-pl-gray-600 border-pl-gray-500 text-pl-white placeholder:text-pl-gray-400 font-body text-sm',
              'focus-visible:border-pl-accent focus-visible:ring-1 focus-visible:ring-pl-accent/20',
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-white/60 font-body">
            {t('onboarding.body.weight')}
          </Label>
          <Input
            type="number"
            inputMode="numeric"
            value={data.weightKg}
            onChange={(e) => onUpdate({ weightKg: e.target.value })}
            placeholder={t('onboarding.body.weightPlaceholder')}
            className={cn(
              'rounded-none h-12 bg-pl-gray-600 border-pl-gray-500 text-pl-white placeholder:text-pl-gray-400 font-body text-sm',
              'focus-visible:border-pl-accent focus-visible:ring-1 focus-visible:ring-pl-accent/20',
            )}
          />
        </div>
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
          onClick={onFinish}
          className="flex-[2] text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)]"
          style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
        >
          {finishLabel ?? t('onboarding.finish')}
        </button>
      </div>
    </div>
  )
}
