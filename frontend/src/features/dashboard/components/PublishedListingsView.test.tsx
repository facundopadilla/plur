import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PublishedListingsView } from './PublishedListingsView'
import type { GarmentOut } from '@/api/generated/types.gen'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: { count?: number }) => opts?.count !== undefined ? `${key}:${opts.count}` : key }),
}))

vi.mock('../hooks/useGarments', () => ({
  useMyGarments: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
}))

vi.mock('@/stores/dashboard.store', () => ({
  useDashboardStore: vi.fn((selector: (s: { selectedCurrency: string }) => unknown) =>
    selector({ selectedCurrency: 'ARS' })
  ),
}))

vi.mock('../data/currencies', () => ({
  getCurrency: vi.fn(() => ({ code: 'ARS', name: 'Argentine Peso', symbol: '$', rate: 1 })),
  formatFiatPrice: vi.fn(() => '$1,000'),
}))

vi.mock('lucide-react', () => ({
  Plus: () => null,
  Tag: () => null,
  Loader2: () => null,
}))

const mockGarment: GarmentOut = {
  id: 42,
  name: 'Blue Jacket',
  description: 'A nice jacket',
  images: ['https://example.com/jacket.jpg'],
  price_plr: 100,
  size: 'M',
  style: 'casual',
  condition: 'good',
  location: 'Buenos Aires',
  tags: [],
  status: 'active',
  seller_id: 1,
  seller_name: 'Juan',
  latitude: null,
  longitude: null,
  created_at: '2024-01-01T00:00:00Z',
}

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('PublishedListingsView', () => {
  const onAdd = vi.fn()
  const onGarmentClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no garments', () => {
    render(<PublishedListingsView onAdd={onAdd} onGarmentClick={onGarmentClick} />, { wrapper: createWrapper() })
    expect(screen.getByText('dashboard.publish.emptyTitle')).toBeInTheDocument()
  })

  it('shows add button in empty state', () => {
    render(<PublishedListingsView onAdd={onAdd} onGarmentClick={onGarmentClick} />, { wrapper: createWrapper() })
    expect(screen.getByText('dashboard.publish.title')).toBeInTheDocument()
  })

  it('calls onAdd when add button is clicked in empty state', async () => {
    const user = userEvent.setup()
    render(<PublishedListingsView onAdd={onAdd} onGarmentClick={onGarmentClick} />, { wrapper: createWrapper() })
    await user.click(screen.getByText('dashboard.publish.title'))
    expect(onAdd).toHaveBeenCalledOnce()
  })

  it('renders garment cards when garments exist', async () => {
    const { useMyGarments } = await import('../hooks/useGarments')
    vi.mocked(useMyGarments).mockReturnValue({
      data: [mockGarment],
      isLoading: false,
      isError: false,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    render(<PublishedListingsView onAdd={onAdd} onGarmentClick={onGarmentClick} />, { wrapper: createWrapper() })
    expect(screen.getByText('Blue Jacket')).toBeInTheDocument()
  })

  it('renders new listing button when garments exist', async () => {
    const { useMyGarments } = await import('../hooks/useGarments')
    vi.mocked(useMyGarments).mockReturnValue({
      data: [mockGarment],
      isLoading: false,
      isError: false,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    render(<PublishedListingsView onAdd={onAdd} onGarmentClick={onGarmentClick} />, { wrapper: createWrapper() })
    expect(screen.getByText('dashboard.publish.newListing')).toBeInTheDocument()
  })
})
