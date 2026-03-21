import { useTranslation } from 'react-i18next'
import { AuthLayout, SignupWizard } from '@/features/auth'

export function Component() {
  const { t } = useTranslation()

  return (
    <AuthLayout title={t('auth.signup')}>
      <SignupWizard />
    </AuthLayout>
  )
}
