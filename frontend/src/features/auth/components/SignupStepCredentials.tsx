import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { SignupFormData } from '../types'

interface SignupStepCredentialsProps {
  data: SignupFormData
  onUpdate: (partial: Partial<SignupFormData>) => void
  onNext: () => void
}

interface FormErrors {
  email?: string | undefined
  password?: string | undefined
  confirmPassword?: string | undefined
}

export function SignupStepCredentials({
  data,
  onUpdate,
  onNext,
}: SignupStepCredentialsProps) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!data.email.trim()) next.email = t('auth.validation.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      next.email = t('auth.validation.emailInvalid')
    if (!data.password) next.password = t('auth.validation.passwordRequired')
    else if (data.password.length < 8)
      next.password = t('auth.validation.passwordMinLength')
    if (!data.confirmPassword) next.confirmPassword = t('auth.validation.passwordRequired')
    else if (data.password !== data.confirmPassword)
      next.confirmPassword = t('auth.validation.passwordsDoNotMatch')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Email */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="signup-email"
          className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-white/60 font-body"
        >
          {t('auth.email')}
        </Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={data.email}
          onChange={(e) => {
            onUpdate({ email: e.target.value })
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
          }}
          aria-invalid={!!errors.email}
          className={cn(
            'rounded-none h-12 bg-pl-gray-600 border-pl-gray-500 text-pl-white placeholder:text-pl-gray-400 font-body text-sm',
            'focus-visible:border-pl-accent focus-visible:ring-1 focus-visible:ring-pl-accent/20',
            errors.email && 'border-pl-red focus-visible:border-pl-red',
          )}
          placeholder="hola@plur.com"
        />
        {errors.email && <p className="text-xs text-pl-red font-body">{errors.email}</p>}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="signup-password"
          className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-white/60 font-body"
        >
          {t('auth.password')}
        </Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={data.password}
            onChange={(e) => {
              onUpdate({ password: e.target.value })
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
            }}
            aria-invalid={!!errors.password}
            className={cn(
              'rounded-none h-12 bg-pl-gray-600 border-pl-gray-500 text-pl-white placeholder:text-pl-gray-400 font-body text-sm pr-12',
              'focus-visible:border-pl-accent focus-visible:ring-1 focus-visible:ring-pl-accent/20',
              errors.password && 'border-pl-red focus-visible:border-pl-red',
            )}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-pl-white/40 hover:text-pl-white transition-colors duration-200 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-pl-red font-body">{errors.password}</p>
        )}
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="signup-confirm"
          className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-white/60 font-body"
        >
          {t('auth.confirmPassword')}
        </Label>
        <div className="relative">
          <Input
            id="signup-confirm"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            value={data.confirmPassword}
            onChange={(e) => {
              onUpdate({ confirmPassword: e.target.value })
              if (errors.confirmPassword)
                setErrors((p) => ({ ...p, confirmPassword: undefined }))
            }}
            aria-invalid={!!errors.confirmPassword}
            className={cn(
              'rounded-none h-12 bg-pl-gray-600 border-pl-gray-500 text-pl-white placeholder:text-pl-gray-400 font-body text-sm pr-12',
              'focus-visible:border-pl-accent focus-visible:ring-1 focus-visible:ring-pl-accent/20',
              errors.confirmPassword && 'border-pl-red focus-visible:border-pl-red',
            )}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? t('auth.hidePassword') : t('auth.showPassword')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-pl-white/40 hover:text-pl-white transition-colors duration-200 cursor-pointer"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-pl-red font-body">{errors.confirmPassword}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="w-full text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)] mt-2"
        style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
      >
        {t('auth.next')}
      </button>
    </div>
  )
}
