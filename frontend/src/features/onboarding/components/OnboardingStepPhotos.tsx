import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OnboardingFormData, ReferencePhotoEntry } from '../types'

interface SlotConfig {
  label: string
  labelKey: string
}

const PHOTO_SLOTS: SlotConfig[] = [
  { label: 'front', labelKey: 'onboarding.photos.front' },
  { label: 'selfie', labelKey: 'onboarding.photos.selfie' },
  { label: 'profile', labelKey: 'onboarding.photos.profile' },
]

interface OnboardingStepPhotosProps {
  data: OnboardingFormData
  onUpdate: (partial: Partial<OnboardingFormData>) => void
  onBack: () => void
  onFinish: () => void
}

export function OnboardingStepPhotos({
  data,
  onUpdate,
  onBack,
  onFinish,
}: OnboardingStepPhotosProps) {
  const { t } = useTranslation()

  const getPhotoByLabel = (label: string): string | undefined =>
    data.referencePhotos.find((p) => p.label === label)?.dataUrl

  const handleFile = (label: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const updated: ReferencePhotoEntry[] = [
        ...data.referencePhotos.filter((p) => p.label !== label),
        { label, dataUrl },
      ]
      onUpdate({ referencePhotos: updated })
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = (label: string) => {
    onUpdate({
      referencePhotos: data.referencePhotos.filter((p) => p.label !== label),
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-[-0.04em] uppercase text-pl-white leading-[0.95] mb-2">
          {t('onboarding.photos.title')}
          <span className="text-pl-accent">.</span>
        </h2>
        <p className="text-[13px] font-light text-pl-white/50 font-body">
          {t('onboarding.photos.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {PHOTO_SLOTS.map(({ label, labelKey }) => (
          <PhotoSlot
            key={label}
            label={t(labelKey)}
            preview={getPhotoByLabel(label)}
            onFile={(file) => handleFile(label, file)}
            onRemove={() => handleRemove(label)}
          />
        ))}
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
          {t('onboarding.finish')}
        </button>
      </div>
    </div>
  )
}

interface PhotoSlotProps {
  label: string
  preview: string | undefined
  onFile: (file: File) => void
  onRemove: () => void
}

function PhotoSlot({ label, preview, onFile, onRemove }: PhotoSlotProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-2 items-center">
      <div className="relative w-full" style={{ paddingBottom: '133%' }}>
        <div className="absolute inset-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
          {preview !== undefined ? (
            <>
              <img src={preview} alt={label} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={onRemove}
                aria-label="Eliminar foto"
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-pl-black/70 flex items-center justify-center hover:bg-pl-black transition-colors"
              >
                <X className="w-3 h-3 text-pl-white" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                'w-full h-full border border-dashed border-pl-gray-600 flex flex-col items-center justify-center gap-2',
                'hover:border-pl-gray-400 hover:bg-pl-gray-800 transition-colors text-pl-gray-500 hover:text-pl-gray-400',
              )}
            >
              <Camera className="w-5 h-5" />
              <span className="text-[9px] font-medium tracking-[0.1em] uppercase font-body">
                {t('onboarding.photos.addPhoto')}
              </span>
            </button>
          )}
        </div>
      </div>
      <p className="text-[10px] text-pl-gray-400 font-body text-center leading-tight">{label}</p>
    </div>
  )
}
