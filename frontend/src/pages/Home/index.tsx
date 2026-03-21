import { useOnboardingStore } from '@/stores/onboarding.store'
import { OnboardingWizard } from '@/features/onboarding'
import { DashboardLayout } from '@/features/dashboard'

export function Component() {
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding)

  if (!hasCompletedOnboarding) {
    return <OnboardingWizard />
  }

  return <DashboardLayout />
}
