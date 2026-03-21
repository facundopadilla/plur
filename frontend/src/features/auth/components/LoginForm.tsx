import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { isNinjaValidationError } from '@/api/errors'
import { useLoginMutation } from '../hooks/useLoginMutation'

interface FormErrors {
  email?: string | undefined
  password?: string | undefined
  general?: string | undefined
}

export function LoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const mutation = useLoginMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!email.trim()) next.email = t('auth.validation.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = t('auth.validation.emailInvalid')
    if (!password) next.password = t('auth.validation.passwordRequired')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    mutation.mutate(
      { email, password },
      {
        onSuccess: () => void navigate('/dashboard'),
        onError: (err) => {
          const data = (err as { response?: { data?: unknown } }).response?.data
          if (isNinjaValidationError(data)) {
            const next: FormErrors = {}
            data.detail.forEach(({ loc, msg }) => {
              const field = loc[loc.length - 1]
              if (field === 'email') next.email = msg
              else if (field === 'password') next.password = msg
              else next.general = msg
            })
            setErrors(next)
          } else {
            setErrors({ general: t('auth.loginError') })
          }
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/* Error general */}
      {errors.general && (
        <div className="border border-pl-red/30 bg-pl-red/10 px-4 py-3">
          <p className="text-xs text-pl-red font-body">{errors.general}</p>
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="login-email"
          className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-white/60 font-body"
        >
          {t('auth.email')}
        </Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
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
        {errors.email && (
          <p className="text-xs text-pl-red font-body">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="login-password"
            className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-white/60 font-body"
          >
            {t('auth.password')}
          </Label>
          <Link
            to="/password-recovery"
            className="text-[11px] text-pl-accent/70 hover:text-pl-accent font-body transition-colors duration-200"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
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

      {/* Submit */}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none mt-2"
        style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
      >
        {mutation.isPending ? t('common.loading') : t('auth.loginButton')}
      </button>

      {/* Link a signup */}
      <p className="text-center text-[12px] text-pl-white/40 font-body">
        {t('auth.noAccount')}{' '}
        <Link
          to="/signup"
          className="text-pl-accent hover:underline transition-colors duration-200"
        >
          {t('auth.signup')}
        </Link>
      </p>
    </form>
  )
}
