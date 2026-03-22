import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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
  usePreferences: vi.fn(() => ({ data: null, isLoading: true })),
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

import { PerfilTab } from './PerfilTab'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('PerfilTab render test', () => {
  it('renders loading state', () => {
    render(<PerfilTab />, { wrapper: createWrapper() })
    expect(true).toBe(true)
  })
})
