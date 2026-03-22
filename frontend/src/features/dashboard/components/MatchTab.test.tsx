import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MatchTab } from './MatchTab'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn((selector: (s: { user: { id: number } | null }) => unknown) =>
    selector({ user: { id: 1 } })
  ),
}))

vi.mock('../hooks/useConversations', () => ({
  useOpenConversations: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
  })),
  useFinalizedConversations: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
  })),
  useConversationMessages: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useSendMessage: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}))

vi.mock('lucide-react', () => ({
  ArrowLeft: () => null,
  Send: () => null,
  MessageCircle: () => null,
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

describe('MatchTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders open conversations section heading', () => {
    render(<MatchTab />, { wrapper: createWrapper() })
    expect(screen.getByText('dashboard.match.open')).toBeInTheDocument()
  })

  it('renders finalized conversations section heading', () => {
    render(<MatchTab />, { wrapper: createWrapper() })
    expect(screen.getByText('dashboard.match.finalized')).toBeInTheDocument()
  })

  it('shows empty open state message when no open conversations', () => {
    render(<MatchTab />, { wrapper: createWrapper() })
    expect(screen.getByText('dashboard.match.emptyOpen')).toBeInTheDocument()
  })

  it('shows empty finalized state message when no finalized conversations', () => {
    render(<MatchTab />, { wrapper: createWrapper() })
    expect(screen.getByText('dashboard.match.emptyFinalized')).toBeInTheDocument()
  })
})
