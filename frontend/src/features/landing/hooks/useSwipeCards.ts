import { useState, useRef, useCallback, useEffect } from 'react'
import type { Garment } from '../data/garments'

type SwipeAction = 'match' | 'nope' | 'save'
type StampState = 'none' | 'match' | 'nope'
type ExitDirection = 'right' | 'left' | 'up' | null

export interface SwipeCardState {
  garment: Garment
  stackPosition: number
}

export interface UseSwipeCardsReturn {
  visibleCards: SwipeCardState[]
  topCardStamp: StampState
  isExiting: boolean
  exitDirection: ExitDirection
  swipe: (action: SwipeAction) => void
  handleTouchStart: (e: React.TouchEvent) => void
  handleTouchEnd: (e: React.TouchEvent) => void
}

export function useSwipeCards(garments: Garment[]): UseSwipeCardsReturn {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [topCardStamp, setTopCardStamp] = useState<StampState>('none')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [exitDirection, setExitDirection] = useState<ExitDirection>(null)
  const touchStartX = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
    }
  }, [])

  const visibleCards: SwipeCardState[] = []
  for (let i = 0; i < 3; i++) {
    const garment = garments[currentIndex + i]
    if (garment !== undefined) {
      visibleCards.push({ garment, stackPosition: i })
    }
  }

  const swipe = useCallback(
    (action: SwipeAction) => {
      if (isAnimating || visibleCards.length === 0) return
      setIsAnimating(true)

      if (action === 'match') setTopCardStamp('match')
      else if (action === 'nope') setTopCardStamp('nope')

      const t1 = setTimeout(() => {
        setIsExiting(true)
        setExitDirection(
          action === 'match' ? 'right' : action === 'nope' ? 'left' : 'up',
        )
      }, 400)

      const t2 = setTimeout(() => {
        setTopCardStamp('none')
        setIsExiting(false)
        setExitDirection(null)
        setCurrentIndex((prev) => {
          const next = prev + 1
          return next >= garments.length - 2 ? 0 : next
        })
        setIsAnimating(false)
      }, 700)

      timersRef.current.push(t1, t2)
    },
    [isAnimating, visibleCards.length, garments.length],
  )

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (touch) {
      touchStartX.current = touch.clientX
    }
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.changedTouches[0]
      if (!touch) return
      const diff = touch.clientX - touchStartX.current
      if (Math.abs(diff) > 60) {
        swipe(diff > 0 ? 'match' : 'nope')
      }
    },
    [swipe],
  )

  return {
    visibleCards,
    topCardStamp,
    isExiting,
    exitDirection,
    swipe,
    handleTouchStart,
    handleTouchEnd,
  }
}
