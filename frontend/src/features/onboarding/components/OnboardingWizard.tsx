import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { StepIndicator } from '@/features/auth/components/StepIndicator'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useProfileStore } from '@/stores/profile.store'
import { useAuthStore } from '@/stores/auth.store'
import type { OnboardingFormData } from '../types'
import { OnboardingStepStyles } from './OnboardingStepStyles'
import { OnboardingStepColors } from './OnboardingStepColors'
import { OnboardingStepBody } from './OnboardingStepBody'
import { OnboardingStepPhotos } from './OnboardingStepPhotos'

const INITIAL_DATA: OnboardingFormData = {
  selectedStyles: [],
  selectedColors: [],
  upperBodySize: null,
  lowerBodySize: null,
  shoeSize: '',
  heightCm: '',
  weightKg: '',
  referencePhotos: [],
}

export function OnboardingWizard() {
  const { t } = useTranslation()
  const { completeOnboarding, skipOnboarding } = useOnboardingStore()
  const addReferencePhoto = useProfileStore((s) => s.addReferencePhoto)
  const userId = useAuthStore((s) => s.user?.id)

  const markDoneForUser = () => {
    if (userId) localStorage.setItem(`plur-onboarding-done-${userId}`, '1')
  }

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<OnboardingFormData>(INITIAL_DATA)

  const stepLabels = [
    t('onboarding.stepStyles'),
    t('onboarding.stepColors'),
    t('onboarding.stepBody'),
    t('onboarding.stepPhotos'),
  ]

  const handleUpdate = (partial: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }))
  }

  const handleFinish = () => {
    formData.referencePhotos.forEach((photo) => {
      addReferencePhoto({ label: photo.label, dataUrl: photo.dataUrl })
    })
    markDoneForUser()
    completeOnboarding({
      styles: formData.selectedStyles,
      colors: formData.selectedColors,
      upperBodySize: formData.upperBodySize,
      lowerBodySize: formData.lowerBodySize,
      shoeSize: formData.shoeSize ? Number(formData.shoeSize) : null,
      heightCm: formData.heightCm ? Number(formData.heightCm) : null,
      weightKg: formData.weightKg ? Number(formData.weightKg) : null,
    })
  }

  return (
    <div className="min-h-screen bg-pl-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 md:px-16 py-6 border-b border-pl-gray-700">
        <Link
          to="/"
          className="font-display text-xl font-extrabold uppercase tracking-[-0.02em] text-pl-white no-underline"
        >
          {t('landing.nav.brand')}
          <span className="text-pl-accent">.</span>
        </Link>
        <button
          type="button"
          onClick={() => { markDoneForUser(); skipOnboarding() }}
          className="text-[11px] font-medium tracking-[0.1em] uppercase text-pl-white/40 font-body hover:text-pl-white transition-colors duration-200 cursor-pointer"
        >
          {t('onboarding.skipLink')}
        </button>
      </header>

      {/* Contenido */}
      <div className="flex-1 flex flex-col justify-start py-10 px-8 md:px-16 overflow-y-auto">
        <div className="w-full max-w-[600px] mx-auto">
          <StepIndicator currentStep={currentStep} labels={stepLabels} />

          {currentStep === 0 && (
            <OnboardingStepStyles
              data={formData}
              onUpdate={handleUpdate}
              onNext={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 1 && (
            <OnboardingStepColors
              data={formData}
              onUpdate={handleUpdate}
              onNext={() => setCurrentStep(2)}
              onBack={() => setCurrentStep(0)}
            />
          )}
          {currentStep === 2 && (
            <OnboardingStepBody
              data={formData}
              onUpdate={handleUpdate}
              onBack={() => setCurrentStep(1)}
              onFinish={() => setCurrentStep(3)}
              finishLabel={t('onboarding.next')}
            />
          )}
          {currentStep === 3 && (
            <OnboardingStepPhotos
              data={formData}
              onUpdate={handleUpdate}
              onBack={() => setCurrentStep(2)}
              onFinish={handleFinish}
            />
          )}
        </div>
      </div>
    </div>
  )
}
