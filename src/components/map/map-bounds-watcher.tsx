import { useEffect } from 'react'
import { useMapEvents } from 'react-leaflet'
import type { BoundingBox } from '../../types/pickup-point'
import { toBoundingBox } from '../../utils/map-bounds'

type MapBoundsWatcherProps = {
  onBoundsChanged: (bounds: BoundingBox) => void
}

export function MapBoundsWatcher({ onBoundsChanged }: MapBoundsWatcherProps) {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChanged(toBoundingBox(map.getBounds()))
    },
    zoomend: () => {
      onBoundsChanged(toBoundingBox(map.getBounds()))
    },
  })

  useEffect(() => {
    onBoundsChanged(toBoundingBox(map.getBounds()))
  }, [map, onBoundsChanged])

  return null
}
