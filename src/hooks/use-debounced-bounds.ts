import { useCallback, useEffect, useRef, useState } from 'react'
import type { BoundingBox } from '../types/pickup-point'
import { hasSignificantBoundsChange } from '../utils/map-bounds'

type UseDebouncedBoundsResult = {
  queryBounds: BoundingBox | null
  onBoundsChanged: (nextBounds: BoundingBox) => void
}

export function useDebouncedBounds(debounceMs: number): UseDebouncedBoundsResult {
  const [queryBounds, setQueryBounds] = useState<BoundingBox | null>(null)
  const debounceTimerRef = useRef<number | null>(null)
  const lastMapBoundsRef = useRef<BoundingBox | null>(null)

  const onBoundsChanged = useCallback(
    (nextBounds: BoundingBox) => {
      if (!hasSignificantBoundsChange(lastMapBoundsRef.current, nextBounds)) {
        return
      }

      lastMapBoundsRef.current = nextBounds

      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = window.setTimeout(() => {
        setQueryBounds(nextBounds)
      }, debounceMs)
    },
    [debounceMs],
  )

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    queryBounds,
    onBoundsChanged,
  }
}
