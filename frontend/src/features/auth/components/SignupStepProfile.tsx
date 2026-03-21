import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AvatarUpload } from './AvatarUpload'
import type { SignupFormData } from '../types'

interface SignupStepProfileProps {
  data: SignupFormData
  onUpdate: (partial: Partial<SignupFormData>) => void
  onBack: () => void
  onSubmit: () => void
  isPending: boolean
}

export function SignupStepProfile({
  data,
  onUpdate,
  onBack,
  onSubmit,
  isPending,
}: SignupStepProfileProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | undefined>()

  const validate = (): boolean => {
    if (data.profilePicture) {
      if (data.profilePicture.size > 5 * 1024 * 1024) {
        setError(t('auth.validation.profilePictureTooLarge'))
        return false
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(data.profilePicture.type)) {
        setError(t('auth.validation.profilePictureInvalidType'))
        return false
      }
    }
    setError(undefined)
    return true
  }

  const handleSubmit = () => {
    if (validate()) onSubmit()
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center">
        <AvatarUpload
          value={data.profilePicture}
          onChange={(file) => {
            onUpdate({ profilePicture: file })
            if (error) setError(undefined)
          }}
          error={error}
        />
      </div>

      {/* Navegación */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="flex-1 text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 border border-pl-white/20 text-pl-white font-body cursor-pointer bg-transparent transition-all duration-300 hover:border-pl-white hover:bg-pl-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
        >
          {t('auth.previous')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
        >
          {isPending ? t('common.loading') : t('auth.signupButton')}
        </button>
      </div>
    </div>
  )
}
