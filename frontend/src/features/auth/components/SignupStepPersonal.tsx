import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { SignupFormData } from '../types'

interface SignupStepPersonalProps {
  data: SignupFormData
  onUpdate: (partial: Partial<SignupFormData>) => void
  onNext: () => void
  onBack: () => void
}

interface FormErrors {
  firstName?: string | undefined
  lastName?: string | undefined
  dateOfBirth?: string | undefined
  phoneNumber?: string | undefined
}

export function SignupStepPersonal({
  data,
  onUpdate,
  onNext,
  onBack,
}: SignupStepPersonalProps) {
  const { t } = useTranslation()
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const next: FormErrors = {}

    if (!data.firstName.trim()) next.firstName = t('auth.validation.firstNameRequired')
    if (!data.lastName.trim()) next.lastName = t('auth.validation.lastNameRequired')

    if (!data.dateOfBirth) {
      next.dateOfBirth = t('auth.validation.dateOfBirthRequired')
    } else {
      const birthDate = new Date(data.dateOfBirth)
      const today = new Date()
      const minAge = 13
      const minDate = new Date(
        today.getFullYear() - minAge,
        today.getMonth(),
        today.getDate(),
      )
      if (birthDate > minDate) next.dateOfBirth = t('auth.validation.dateOfBirthInvalid')
    }

    if (!data.phoneNumber.trim()) {
      next.phoneNumber = t('auth.validation.phoneRequired')
    } else if (!/^\d{6,15}$/.test(data.phoneNumber.replace(/\s/g, ''))) {
      next.phoneNumber = t('auth.validation.phoneInvalid')
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  const inputClass = (hasError: boolean) =>
    cn(
      'rounded-none h-12 bg-pl-gray-600 border-pl-gray-500 text-pl-white placeholder:text-pl-gray-400 font-body text-sm',
      'focus-visible:border-pl-accent focus-visible:ring-1 focus-visible:ring-pl-accent/20',
      hasError && 'border-pl-red focus-visible:border-pl-red',
    )

  const labelClass =
    'text-[10px] font-medium tracking-[0.15em] uppercase text-pl-white/60 font-body'

  return (
    <div className="flex flex-col gap-6">
      {/* Nombre + Apellidos en grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-firstname" className={labelClass}>
            {t('auth.firstName')}
          </Label>
          <Input
            id="signup-firstname"
            type="text"
            autoComplete="given-name"
            value={data.firstName}
            onChange={(e) => {
              onUpdate({ firstName: e.target.value })
              if (errors.firstName) setErrors((p) => ({ ...p, firstName: undefined }))
            }}
            aria-invalid={!!errors.firstName}
            className={inputClass(!!errors.firstName)}
            placeholder="Ana"
          />
          {errors.firstName && (
            <p className="text-xs text-pl-red font-body">{errors.firstName}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-lastname" className={labelClass}>
            {t('auth.lastName')}
          </Label>
          <Input
            id="signup-lastname"
            type="text"
            autoComplete="family-name"
            value={data.lastName}
            onChange={(e) => {
              onUpdate({ lastName: e.target.value })
              if (errors.lastName) setErrors((p) => ({ ...p, lastName: undefined }))
            }}
            aria-invalid={!!errors.lastName}
            className={inputClass(!!errors.lastName)}
            placeholder="García"
          />
          {errors.lastName && (
            <p className="text-xs text-pl-red font-body">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Fecha de nacimiento */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-dob" className={labelClass}>
          {t('auth.dateOfBirth')}
        </Label>
        <Input
          id="signup-dob"
          type="date"
          autoComplete="bday"
          value={data.dateOfBirth}
          onChange={(e) => {
            onUpdate({ dateOfBirth: e.target.value })
            if (errors.dateOfBirth) setErrors((p) => ({ ...p, dateOfBirth: undefined }))
          }}
          aria-invalid={!!errors.dateOfBirth}
          max={new Date().toISOString().split('T')[0]}
          className={cn(
            inputClass(!!errors.dateOfBirth),
            '[color-scheme:dark]',
          )}
        />
        {errors.dateOfBirth && (
          <p className="text-xs text-pl-red font-body">{errors.dateOfBirth}</p>
        )}
      </div>

      {/* Celular */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-phone" className={labelClass}>
          {t('auth.phoneNumber')}
        </Label>
        <div className="flex">
          <span className="flex items-center px-4 bg-pl-gray-500 border border-pl-gray-500 border-r-0 text-pl-white/60 text-sm font-body select-none whitespace-nowrap">
            +54
          </span>
          <Input
            id="signup-phone"
            type="tel"
            autoComplete="tel"
            value={data.phoneNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d\s]/g, '')
              onUpdate({ phoneNumber: val })
              if (errors.phoneNumber) setErrors((p) => ({ ...p, phoneNumber: undefined }))
            }}
            aria-invalid={!!errors.phoneNumber}
            className={cn(
              inputClass(!!errors.phoneNumber),
              'rounded-none',
            )}
            placeholder="11 1234 5678"
          />
        </div>
        {errors.phoneNumber && (
          <p className="text-xs text-pl-red font-body">{errors.phoneNumber}</p>
        )}
      </div>

      {/* Navegación */}
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 border border-pl-white/20 text-pl-white font-body cursor-pointer bg-transparent transition-all duration-300 hover:border-pl-white hover:bg-pl-white/5"
          style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
        >
          {t('auth.previous')}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)]"
          style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
        >
          {t('auth.next')}
        </button>
      </div>
    </div>
  )
}
