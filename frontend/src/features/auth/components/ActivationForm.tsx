import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useActivationMutation } from '../hooks/useActivationMutation'

export function ActivationForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mutation = useActivationMutation()

  const email = searchParams.get('email') ?? ''
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | undefined>()
  const [serverError, setServerError] = useState<string | undefined>()

  // Redirect countdown after success
  useEffect(() => {
    if (!mutation.isSuccess) return
    const timer = setTimeout(() => void navigate('/login'), 3000)
    return () => clearTimeout(timer)
  }, [mutation.isSuccess, navigate])

  const validate = (): boolean => {
    if (!code.trim()) {
      setCodeError(t('auth.validation.codeRequired'))
      return false
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setCodeError(t('auth.validation.codeInvalid'))
      return false
    }
    setCodeError(undefined)
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setServerError(undefined)
    mutation.mutate(
      { email, code: code.trim() },
      {
        onError: () => setServerError(t('common.error')),
      },
    )
  }

  if (mutation.isSuccess) {
    return (
      <div className="flex flex-col items-center text-center gap-6 py-8">
        <div className="w-16 h-16 rounded-full bg-pl-accent/10 border border-pl-accent/30 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-pl-accent" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold uppercase tracking-[-0.02em] text-pl-white mb-2">
            {t('auth.activationSuccess')}
          </h3>
          <p className="text-[13px] font-light leading-[1.6] text-pl-white/50 font-body max-w-[300px]">
            {t('auth.activationSuccessDescription')}
          </p>
        </div>
        {/* Barra de progreso para el countdown */}
        <div className="w-full max-w-[200px] h-0.5 bg-pl-gray-500 overflow-hidden">
          <div
            className="h-full bg-pl-accent"
            style={{ animation: 'progressFill 3s linear forwards' }}
          />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/* Email de referencia */}
      {email && (
        <div className="px-4 py-3 bg-pl-gray-600 border border-pl-gray-500">
          <p className="text-[11px] text-pl-white/40 font-body tracking-[0.05em] uppercase mb-1">
            Enviado a
          </p>
          <p className="text-[13px] text-pl-white/80 font-body">{email}</p>
        </div>
      )}

      {serverError && (
        <div className="border border-pl-red/30 bg-pl-red/10 px-4 py-3">
          <p className="text-xs text-pl-red font-body">{serverError}</p>
        </div>
      )}

      {/* Código */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="activation-code"
          className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-white/60 font-body"
        >
          {t('auth.activationCode')}
        </Label>
        <Input
          id="activation-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '')
            setCode(val)
            if (codeError) setCodeError(undefined)
            if (serverError) setServerError(undefined)
          }}
          aria-invalid={!!codeError}
          className={cn(
            'rounded-none h-14 bg-pl-gray-600 border-pl-gray-500 text-pl-white placeholder:text-pl-gray-400 font-display text-2xl font-bold tracking-[0.5em] text-center',
            'focus-visible:border-pl-accent focus-visible:ring-1 focus-visible:ring-pl-accent/20',
            codeError && 'border-pl-red focus-visible:border-pl-red',
          )}
          placeholder="000000"
        />
        {codeError && <p className="text-xs text-pl-red font-body">{codeError}</p>}
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none mt-2"
        style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
      >
        {mutation.isPending ? t('common.loading') : t('auth.activationButton')}
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
