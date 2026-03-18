import { useEffect, useState } from 'react'
import { APP_CONFIG } from '../config'
import { fetchPickupPointsPage } from '../services/pickup-point-service'
import type { BoundingBox, PickupPoint } from '../types/pickup-point'
import type { LoadingProgress } from '../types/ui'

type UsePickupPointsResult = {
  pickupPoints: PickupPoint[]
  loading: boolean
  loadingSummary: string
  loadingProgress: LoadingProgress | null
  error: string | null
}

export function usePickupPoints(queryBounds: BoundingBox | null): UsePickupPointsResult {
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState('')
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!queryBounds) {
      return
    }

    const controller = new AbortController()

    const loadPoints = async () => {
      setLoading(true)
      setError(null)
      setLoadingSummary('Csomagpontok betöltése...')
      setLoadingProgress({
        loaded: 0,
        total: 0,
        target: 0,
        percent: 0,
      })

      try {
        let currentPage = 1
        let hasMorePages = true
        let total = 0
        const byId = new Map<string, PickupPoint>()

        while (hasMorePages && byId.size < APP_CONFIG.maxPointsToRender) {
          const pageResult = await fetchPickupPointsPage(currentPage, queryBounds, controller.signal)
          hasMorePages = pageResult.paginatorInfo.hasMorePages
          total = pageResult.paginatorInfo.total

          for (const point of pageResult.data) {
            byId.set(point.id, point)
          }

          const partialResult = Array.from(byId.values())
          const target = total > 0 ? Math.min(total, APP_CONFIG.maxPointsToRender) : 0
          const percent = target > 0 ? Math.min(100, Math.round((partialResult.length / target) * 100)) : 0

          setPickupPoints(partialResult)
          setLoadingSummary(`Betöltve: ${partialResult.length} / ${total}`)
          setLoadingProgress({
            loaded: partialResult.length,
            total,
            target,
            percent,
          })

          currentPage += 1
        }

        const result = Array.from(byId.values())
        const target = total > 0 ? Math.min(total, APP_CONFIG.maxPointsToRender) : result.length

        setPickupPoints(result)
        setLoadingProgress({
          loaded: result.length,
          total,
          target,
          percent: target > 0 ? Math.min(100, Math.round((result.length / target) * 100)) : 100,
        })
        setLoadingSummary(
          total > result.length
            ? `Megjelenítve ${result.length} pont (teljes találat: ${total})`
            : `Megjelenítve ${result.length} pont`,
        )
      } catch (loadError) {
        if ((loadError as Error).name === 'AbortError') {
          return
        }

        setError((loadError as Error).message || 'Ismeretlen GraphQL hiba történt.')
      } finally {
        setLoading(false)
      }
    }

    void loadPoints()

    return () => {
      controller.abort()
    }
  }, [queryBounds])

  return {
    pickupPoints,
    loading,
    loadingSummary,
    loadingProgress,
    error,
  }
}
