import L from 'leaflet'
import type { BoundingBox } from '../types/pickup-point'

const BOUNDS_CHANGE_THRESHOLD = 0.003

export function toBoundingBox(bounds: L.LatLngBounds): BoundingBox {
  const southWest = bounds.getSouthWest()
  const northEast = bounds.getNorthEast()

  return {
    southWest: {
      latitude: southWest.lat,
      longitude: southWest.lng,
    },
    northEast: {
      latitude: northEast.lat,
      longitude: northEast.lng,
    },
  }
}

export function hasSignificantBoundsChange(previous: BoundingBox | null, next: BoundingBox): boolean {
  if (!previous) {
    return true
  }

  return (
    Math.abs(previous.southWest.latitude - next.southWest.latitude) > BOUNDS_CHANGE_THRESHOLD ||
    Math.abs(previous.southWest.longitude - next.southWest.longitude) > BOUNDS_CHANGE_THRESHOLD ||
    Math.abs(previous.northEast.latitude - next.northEast.latitude) > BOUNDS_CHANGE_THRESHOLD ||
    Math.abs(previous.northEast.longitude - next.northEast.longitude) > BOUNDS_CHANGE_THRESHOLD
  )
}
