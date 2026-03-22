import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreditosTab } from './CreditosTab'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../hooks/useCredits', () => ({
  useCredits: vi.fn(() => ({
    credits: 250,
    transactions: [],
    isLoading: false,
    error: null,
  })),
}))

vi.mock('./ComprarModal', () => ({
  ComprarModal: () => null,
}))

vi.mock('@/stores/dashboard.store', () => ({
  useDashboardStore: vi.fn((selector: (s: { selectedCurrency: string; setSelectedCurrency: () => void }) => unknown) =>
    selector({ selectedCurrency: 'ARS', setSelectedCurrency: vi.fn() })
  ),
}))

vi.mock('../data/currencies', () => ({
  CURRENCIES: [
    { code: 'ARS', name: 'Argentine Peso' },
    { code: 'USD', name: 'US Dollar' },
  ],
}))

vi.mock('lucide-react', () => ({
  ArrowUpRight: () => null,
  ArrowDownLeft: () => null,
  ShoppingCart: () => null,
  Loader2: () => null,
  ExternalLink: () => null,
  X: () => null,
  Copy: () => null,
  Check: () => null,
  ShoppingBag: () => null,
}))

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('CreditosTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders balance label', () => {
    render(<CreditosTab />, { wrapper: createWrapper() })
    expect(screen.getByText('dashboard.creditos.balance')).toBeInTheDocument()
  })

  it('renders wallet balance value', () => {
    render(<CreditosTab />, { wrapper: createWrapper() })
    expect(screen.getByText('250')).toBeInTheDocument()
  })

  it('renders PLR currency label', () => {
    render(<CreditosTab />, { wrapper: createWrapper() })
    expect(screen.getByText('PLR')).toBeInTheDocument()
  })

  it('renders Comprar button', () => {
    render(<CreditosTab />, { wrapper: createWrapper() })
    expect(screen.getByText('dashboard.comprar.title')).toBeInTheDocument()
  })

  it('renders currency selector with currency codes', () => {
    render(<CreditosTab />, { wrapper: createWrapper() })
    expect(screen.getByText('ARS')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
  })

  it('renders transaction history label', () => {
    render(<CreditosTab />, { wrapper: createWrapper() })
    expect(screen.getByText('dashboard.creditos.history')).toBeInTheDocument()
  })

  it('shows empty history message when no transactions', () => {
    render(<CreditosTab />, { wrapper: createWrapper() })
    expect(screen.getByText('dashboard.creditos.emptyHistory')).toBeInTheDocument()
  })
})
