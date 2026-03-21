import { useTranslation } from 'react-i18next'
import { AuthLayout, ActivationForm } from '@/features/auth'

export function Component() {
  const { t } = useTranslation()

  return (
    <AuthLayout
      title={t('auth.activation')}
      subtitle={t('auth.activationDescription')}
    >
      <ActivationForm />
    </AuthLayout>
  )
}
