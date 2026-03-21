import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { usePasswordRecoveryMutation } from '../hooks/usePasswordRecoveryMutation'

export function PasswordRecoveryForm() {
  const { t } = useTranslation()
  const mutation = usePasswordRecoveryMutation()

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()

  const validate = (): boolean => {
    if (!email.trim()) {
      setEmailError(t('auth.validation.emailRequired'))
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t('auth.validation.emailInvalid'))
      return false
    }
    setEmailError(undefined)
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate({ email })
  }

  if (mutation.isSuccess) {
    return (
      <div className="flex flex-col items-center text-center gap-6 py-8">
        <div className="w-16 h-16 rounded-full bg-pl-accent/10 border border-pl-accent/30 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-pl-accent" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold uppercase tracking-[-0.02em] text-pl-white mb-2">
            {t('auth.passwordRecoverySent')}
          </h3>
          <p className="text-[13px] font-light leading-[1.6] text-pl-white/50 font-body max-w-[300px]">
            {t('auth.passwordRecoverySentDescription')}
          </p>
        </div>
        <Link
          to="/login"
          className="text-[11px] font-medium tracking-[0.12em] uppercase text-pl-accent hover:underline font-body transition-colors duration-200"
        >
          {t('auth.backToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="recovery-email"
          className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-white/60 font-body"
        >
          {t('auth.email')}
        </Label>
        <Input
          id="recovery-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (emailError) setEmailError(undefined)
          }}
          aria-invalid={!!emailError}
          className={cn(
            'rounded-none h-12 bg-pl-gray-600 border-pl-gray-500 text-pl-white placeholder:text-pl-gray-400 font-body text-sm',
            'focus-visible:border-pl-accent focus-visible:ring-1 focus-visible:ring-pl-accent/20',
            emailError && 'border-pl-red focus-visible:border-pl-red',
          )}
          placeholder="hola@plur.com"
        />
        {emailError && <p className="text-xs text-pl-red font-body">{emailError}</p>}
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none mt-2"
        style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
      >
        {mutation.isPending ? t('common.loading') : t('auth.passwordRecoveryButton')}
      </button>

      <p className="text-center text-[12px] text-pl-white/40 font-body">
        <Link
          to="/login"
          className="text-pl-accent hover:underline transition-colors duration-200"
        >
          {t('auth.backToLogin')}
        </Link>
      </p>
    </form>
  )
}
