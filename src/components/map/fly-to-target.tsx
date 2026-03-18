import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { SearchTarget } from '../../types/ui'

type FlyToTargetProps = {
  target: SearchTarget | null
}

export function FlyToTarget({ target }: FlyToTargetProps) {
  const map = useMap()

  useEffect(() => {
    if (!target) {
      return
    }

    map.flyTo(target.center, target.zoom, { duration: 0.9 })
  }, [map, target])

  return null
}
