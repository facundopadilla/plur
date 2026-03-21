import { useState, useCallback } from 'react'

interface UsePhotoAlbumReturn {
  currentIndex: number
  total: number
  next: () => void
  prev: () => void
  goTo: (index: number) => void
}

export function usePhotoAlbum(imageCount: number): UsePhotoAlbumReturn {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % imageCount)
  }, [imageCount])

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + imageCount) % imageCount)
  }, [imageCount])

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < imageCount) {
      setCurrentIndex(index)
    }
  }, [imageCount])

  return { currentIndex, total: imageCount, next, prev, goTo }
}
