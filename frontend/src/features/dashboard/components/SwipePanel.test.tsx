import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SwipePanel } from './SwipePanel'
import type { DashboardGarment } from '../types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}))

vi.mock('@/features/flags', () => ({
  FEATURE_FLAGS: {
    DASHBOARD_IA_V2: false,
    MATCH_CHAT: false,
    PROXIMITY_SORT: false,
    TRANSAK_ONRAMP: false,
  },
}))

const mockGarment: DashboardGarment = {
  id: '1',
  name: 'Test Garment',
  description: 'A test garment',
  images: ['https://example.com/img.jpg'],
  pricePLR: 10,
  size: 'M',
  style: 'casual',
  condition: 'good',
  location: 'Buenos Aires',
  tags: [],
  seller: { name: 'Test Seller', avatarUrl: '', bio: '' },
}

vi.mock('../hooks/useNearbyGarments', () => ({
  useNearbyGarments: vi.fn(() => ({
    data: undefined,
    isLoading: false,
  })),
}))

vi.mock('../hooks/useGarments', () => ({
  useGarmentFeed: vi.fn(() => ({
    data: [mockGarment],
    isLoading: false,
  })),
}))

vi.mock('../hooks/useDashboardSwipe', () => ({
  useDashboardSwipe: vi.fn(() => ({
    visibleCards: [{ garment: mockGarment, stackPosition: 0 }],
    topCardStamp: 'none',
    isExiting: false,
    exitDirection: null,
    isEmpty: false,
    swipe: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchEnd: vi.fn(),
  })),
}))

const mockResetSeen = vi.fn()
const mockSetActiveTab = vi.fn()
const mockSetMobileOverlay = vi.fn()
const mockCreateChat = vi.fn(() => 'chat-1')

vi.mock('@/stores/dashboard.store', () => ({
  useDashboardStore: vi.fn(() => ({
    resetSeen: mockResetSeen,
    setActiveTab: mockSetActiveTab,
    setMobileOverlay: mockSetMobileOverlay,
    createChat: mockCreateChat,
  })),
}))

vi.mock('@/stores/profile.store', () => ({
  useProfileStore: vi.fn((selector: (s: { referencePhotos: unknown[] }) => unknown) =>
    selector({ referencePhotos: [] })
  ),
}))
vi.mock('./DashboardSwipeCard', () => ({
  DashboardSwipeCard: ({ garment }: { garment: DashboardGarment }) => (
    <div data-testid="swipe-card">{garment.name}</div>
  ),
}))

vi.mock('./SwipeActions', () => ({
  SwipeActions: () => <div data-testid="swipe-actions" />,
}))

vi.mock('./ReferencePhotoPrompt', () => ({
  ReferencePhotoPrompt: () => null,
}))

vi.mock('./FiltersDrawer', () => ({
  FiltersDrawer: () => null,
}))

vi.mock('lucide-react', () => ({
  RefreshCw: () => null,
  Filter: () => null,
}))

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('SwipePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the swipe card area', () => {
    render(<SwipePanel />, { wrapper: createWrapper() })
    expect(screen.getByTestId('swipe-card')).toBeInTheDocument()
  })

  it('renders the garment name on the card', () => {
    render(<SwipePanel />, { wrapper: createWrapper() })
    expect(screen.getByText('Test Garment')).toBeInTheDocument()
  })

  it('renders swipe actions', () => {
    render(<SwipePanel />, { wrapper: createWrapper() })
    expect(screen.getByTestId('swipe-actions')).toBeInTheDocument()
  })

  it('shows empty state reset button when no garments remain', async () => {
    const { useDashboardSwipe } = await import('../hooks/useDashboardSwipe')
    vi.mocked(useDashboardSwipe).mockReturnValue({
      visibleCards: [],
      topCardStamp: 'none',
      isExiting: false,
      exitDirection: null,
      isEmpty: true,
      canUndo: false,
      dragOffset: 0,
      isDragging: false,
      swipe: vi.fn(),
      undo: vi.fn(),
      handlePointerDown: vi.fn(),
      handlePointerMove: vi.fn(),
      handlePointerUp: vi.fn(),
    })

    render(<SwipePanel />, { wrapper: createWrapper() })
    expect(screen.getByText('Reset')).toBeInTheDocument()
  })
})
