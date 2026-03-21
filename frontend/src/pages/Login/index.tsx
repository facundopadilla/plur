import { useTranslation } from 'react-i18next'
import { AuthLayout, LoginForm } from '@/features/auth'

export function Component() {
  const { t } = useTranslation()

  return (
    <AuthLayout title={t('auth.login')}>
      <LoginForm />
    </AuthLayout>
  )
}
