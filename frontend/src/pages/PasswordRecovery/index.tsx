import { useTranslation } from 'react-i18next'
import { AuthLayout, PasswordRecoveryForm } from '@/features/auth'

export function Component() {
  const { t } = useTranslation()

  return (
    <AuthLayout
      title={t('auth.passwordRecovery')}
      subtitle={t('auth.passwordRecoveryDescription')}
    >
      <PasswordRecoveryForm />
    </AuthLayout>
  )
}
