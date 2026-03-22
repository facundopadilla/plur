import { useOnboardingStore } from '@/stores/onboarding.store'
import { useAuthStore } from '@/stores/auth.store'
import { OnboardingWizard } from '@/features/onboarding'
import { DashboardLayout } from '@/features/dashboard'

export function Component() {
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding)
  const user = useAuthStore((s) => s.user)

  // Check per-user onboarding flag (survives logout/login cycles)
  const userId = user?.id
  const perUserKey = userId ? `plur-onboarding-done-${userId}` : null
  const userCompletedBefore = perUserKey ? localStorage.getItem(perUserKey) === '1' : false

  if (!hasCompletedOnboarding && !userCompletedBefore) {
    return <OnboardingWizard />
  }

  // If zustand says not completed but per-user flag says yes, sync it
  if (!hasCompletedOnboarding && userCompletedBefore) {
    useOnboardingStore.getState().skipOnboarding()
  }

  return <DashboardLayout />
}
