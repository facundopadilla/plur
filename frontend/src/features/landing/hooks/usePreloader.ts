import { useState, useEffect } from 'react'

export function usePreloader(): { isVisible: boolean } {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2200)
    return () => clearTimeout(timer)
  }, [])

  return { isVisible }
}
