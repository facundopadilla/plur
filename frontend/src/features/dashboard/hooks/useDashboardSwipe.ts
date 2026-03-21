import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { DashboardGarment, StampState, ExitDirection } from '../types'
import { useDashboardStore } from '@/stores/dashboard.store'

type SwipeAction = 'like' | 'dislike'

export interface SwipeCardState {
  garment: DashboardGarment
  stackPosition: number
}

export interface UseDashboardSwipeReturn {
  visibleCards: SwipeCardState[]
  topCardStamp: StampState
  isExiting: boolean
  exitDirection: ExitDirection
  isEmpty: boolean
  swipe: (action: SwipeAction) => void
  handleTouchStart: (e: React.TouchEvent) => void
  handleTouchEnd: (e: React.TouchEvent) => void
}

export function useDashboardSwipe(garments: DashboardGarment[]): UseDashboardSwipeReturn {
  const { seenGarmentIds, markAsSeen, addLikedItem } = useDashboardStore()

  const unseenGarments = useMemo(
    () => garments.filter((g) => !seenGarmentIds.includes(g.id)),
    [garments, seenGarmentIds],
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [topCardStamp, setTopCardStamp] = useState<StampState>('none')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [exitDirection, setExitDirection] = useState<ExitDirection>(null)
  const touchStartX = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Reset index when unseen garments change (e.g., after resetSeen)
  useEffect(() => {
    setCurrentIndex(0)
  }, [unseenGarments.length])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
    }
  }, [])

  const visibleCards: SwipeCardState[] = []
  for (let i = 0; i < 3; i++) {
    const garment = unseenGarments[currentIndex + i]
    if (garment !== undefined) {
      visibleCards.push({ garment, stackPosition: i })
    }
  }

  const isEmpty = unseenGarments.length === 0 || currentIndex >= unseenGarments.length

  const swipe = useCallback(
    (action: SwipeAction) => {
      if (isAnimating || visibleCards.length === 0) return

      const topGarment = visibleCards[0]?.garment
      if (!topGarment) return

      setIsAnimating(true)

      if (action === 'like') {
        setTopCardStamp('match')
        addLikedItem(topGarment)
      } else {
        setTopCardStamp('nope')
      }
      markAsSeen(topGarment.id)

      const t1 = setTimeout(() => {
        setIsExiting(true)
        setExitDirection(action === 'like' ? 'right' : 'left')
      }, 400)

      const t2 = setTimeout(() => {
        setTopCardStamp('none')
        setIsExiting(false)
        setExitDirection(null)
        setCurrentIndex((prev) => prev + 1)
        setIsAnimating(false)
      }, 700)

      timersRef.current.push(t1, t2)
    },
    [isAnimating, visibleCards, addLikedItem, markAsSeen],
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
        swipe(diff > 0 ? 'like' : 'dislike')
      }
    },
    [swipe],
  )

  return {
    visibleCards,
    topCardStamp,
    isExiting,
    exitDirection,
    isEmpty,
    swipe,
    handleTouchStart,
    handleTouchEnd,
  }
}
