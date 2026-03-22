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
  canUndo: boolean
  dragOffset: number
  isDragging: boolean
  swipe: (action: SwipeAction) => void
  undo: () => void
  handlePointerDown: (e: React.PointerEvent) => void
  handlePointerMove: (e: React.PointerEvent) => void
  handlePointerUp: () => void
}

interface UndoEntry {
  garment: DashboardGarment
  action: SwipeAction
}

const SWIPE_THRESHOLD = 80

export function useDashboardSwipe(garments: DashboardGarment[]): UseDashboardSwipeReturn {
  const { seenGarmentIds, markAsSeen, unmarkSeen, addLikedItem, removeLikedItem } = useDashboardStore()

  const unseenGarments = useMemo(
    () => garments.filter((g) => !seenGarmentIds.includes(g.id)),
    [garments, seenGarmentIds],
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [topCardStamp, setTopCardStamp] = useState<StampState>('none')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [exitDirection, setExitDirection] = useState<ExitDirection>(null)
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([])
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const dragStartX = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    setCurrentIndex(0)
  }, [unseenGarments.length])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(clearTimeout)
    }
  }, [])

  const visibleCards = useMemo(() => {
    const cards: SwipeCardState[] = []
    for (let i = 0; i < 3; i++) {
      const garment = unseenGarments[currentIndex + i]
      if (garment !== undefined) {
        cards.push({ garment, stackPosition: i })
      }
    }
    return cards
  }, [unseenGarments, currentIndex])

  const isEmpty = unseenGarments.length === 0 || currentIndex >= unseenGarments.length

  const swipe = useCallback(
    (action: SwipeAction) => {
      if (isAnimating || visibleCards.length === 0) return

      const topGarment = visibleCards[0]?.garment
      if (!topGarment) return

      setIsAnimating(true)
      setIsDragging(false)
      setDragOffset(0)

      if (action === 'like') {
        setTopCardStamp('match')
        addLikedItem(topGarment)
      } else {
        setTopCardStamp('nope')
      }
      markAsSeen(topGarment.id)
      setUndoStack((prev) => [...prev.slice(-9), { garment: topGarment, action }])

      const t1 = setTimeout(() => {
        setIsExiting(true)
        setExitDirection(action === 'like' ? 'right' : 'left')
      }, 300)

      const t2 = setTimeout(() => {
        setTopCardStamp('none')
        setIsExiting(false)
        setExitDirection(null)
        setCurrentIndex((prev) => prev + 1)
        setIsAnimating(false)
      }, 600)

      timersRef.current.push(t1, t2)
    },
    [isAnimating, visibleCards, addLikedItem, markAsSeen],
  )

  const undo = useCallback(() => {
    if (isAnimating || undoStack.length === 0) return

    const lastEntry = undoStack[undoStack.length - 1]
    if (!lastEntry) return

    setUndoStack((prev) => prev.slice(0, -1))
    unmarkSeen(lastEntry.garment.id)
    if (lastEntry.action === 'like') {
      removeLikedItem(lastEntry.garment.id)
    }
  }, [isAnimating, undoStack, unmarkSeen, removeLikedItem])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isAnimating || isEmpty) return
      setIsDragging(true)
      dragStartX.current = e.clientX
    },
    [isAnimating, isEmpty],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      const diff = e.clientX - dragStartX.current
      setDragOffset(diff)
    },
    [isDragging],
  )

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
      swipe(dragOffset > 0 ? 'like' : 'dislike')
    } else {
      setDragOffset(0)
    }
  }, [isDragging, dragOffset, swipe])

  return {
    visibleCards,
    topCardStamp,
    isExiting,
    exitDirection,
    isEmpty,
    canUndo: undoStack.length > 0,
    dragOffset,
    isDragging,
    swipe,
    undo,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
