import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isNinjaValidationError } from '@/api/errors'
import { useSignupMutation } from '../hooks/useSignupMutation'
import { StepIndicator } from './StepIndicator'
import { SignupStepCredentials } from './SignupStepCredentials'
import { SignupStepPersonal } from './SignupStepPersonal'
import { SignupStepProfile } from './SignupStepProfile'
import type { SignupFormData } from '../types'

const INITIAL_DATA: SignupFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  phoneNumber: '',
  profilePicture: null,
}

export function SignupWizard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const mutation = useSignupMutation()

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<SignupFormData>(INITIAL_DATA)
  const [serverError, setServerError] = useState<string | null>(null)

  const stepLabels = [
    t('auth.stepCredentials'),
    t('auth.stepPersonal'),
    t('auth.stepProfile'),
  ]

  const handleUpdate = (partial: Partial<SignupFormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }))
  }

  const handleSubmit = () => {
    setServerError(null)
    mutation.mutate(
      {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        phone_number: formData.phoneNumber,
        ...(formData.profilePicture ? { profile_picture: formData.profilePicture } : {}),
      },
      {
        onSuccess: () => {
          void navigate(`/activate?email=${encodeURIComponent(formData.email)}`)
        },
        onError: (err) => {
          const data = (err as { response?: { data?: unknown } }).response?.data
          if (isNinjaValidationError(data)) {
            const msgs = data.detail.map(({ msg }) => msg).join('. ')
            setServerError(msgs)
          } else {
            setServerError(t('common.error'))
          }
          // Volver al primer paso si hay error de credenciales
          setCurrentStep(0)
        },
      },
    )
  }

  return (
    <div>
      <StepIndicator currentStep={currentStep} labels={stepLabels} />

      {serverError && (
        <div className="border border-pl-red/30 bg-pl-red/10 px-4 py-3 mb-6">
          <p className="text-xs text-pl-red font-body">{serverError}</p>
        </div>
      )}

      {currentStep === 0 && (
        <SignupStepCredentials
          data={formData}
          onUpdate={handleUpdate}
          onNext={() => setCurrentStep(1)}
        />
      )}
      {currentStep === 1 && (
        <SignupStepPersonal
          data={formData}
          onUpdate={handleUpdate}
          onNext={() => setCurrentStep(2)}
          onBack={() => setCurrentStep(0)}
        />
      )}
      {currentStep === 2 && (
        <SignupStepProfile
          data={formData}
          onUpdate={handleUpdate}
          onBack={() => setCurrentStep(1)}
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
        />
      )}

      <p className="text-center text-[12px] text-pl-white/40 font-body mt-8">
        {t('auth.hasAccount')}{' '}
        <Link
          to="/login"
          className="text-pl-accent hover:underline transition-colors duration-200"
        >
          {t('auth.login')}
        </Link>
      </p>
    </div>
  )
}
