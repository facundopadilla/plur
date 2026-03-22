import { describe, it, expect, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/api/client', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('@hey-api/client-axios', () => ({
  createClient: vi.fn(() => ({})),
  createConfig: vi.fn(() => ({})),
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(() => ({ accessToken: null })),
}))

vi.mock('../hooks/usePreferences', () => ({
  usePreferences: vi.fn(() => ({ data: null, isLoading: false })),
  useUpdatePreferences: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

vi.mock('@/features/onboarding/data/styles', () => ({
  STYLE_OPTIONS: [],
}))

vi.mock('@/features/onboarding/data/colors', () => ({
  COLOR_OPTIONS: [],
}))

vi.mock('@/features/onboarding/data/sizes', () => ({
  CLOTHING_SIZES: [],
}))

vi.mock('lucide-react', () => ({
  Loader2: () => null,
  Check: () => null,
  AlertCircle: () => null,
}))

describe('minimal', () => {
  it('works', () => {
    expect(1 + 1).toBe(2)
  })
})

import { PerfilTab } from './PerfilTab'

describe('with PerfilTab', () => {
  it('loaded', () => {
    expect(typeof PerfilTab).toBe('function')
  })
})
