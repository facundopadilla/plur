import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface OnboardingPreferences {
  styles: string[]
  colors: string[]
  upperBodySize: string | null
  lowerBodySize: string | null
  shoeSize: number | null
  heightCm: number | null
  weightKg: number | null
}

interface OnboardingState {
  hasCompletedOnboarding: boolean
  preferences: OnboardingPreferences
  completeOnboarding: (prefs: OnboardingPreferences) => void
  skipOnboarding: () => void
  resetOnboarding: () => void
}

const EMPTY_PREFERENCES: OnboardingPreferences = {
  styles: [],
  colors: [],
  upperBodySize: null,
  lowerBodySize: null,
  shoeSize: null,
  heightCm: null,
  weightKg: null,
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      preferences: EMPTY_PREFERENCES,

      completeOnboarding: (prefs) =>
        set({ hasCompletedOnboarding: true, preferences: prefs }),

      skipOnboarding: () =>
        set({ hasCompletedOnboarding: true }),

      resetOnboarding: () =>
        set({ hasCompletedOnboarding: false, preferences: EMPTY_PREFERENCES }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
)
