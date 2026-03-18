import { useCallback, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { SEARCH_CONFIG, APP_CONFIG } from './config'
import { MapSection } from './components/map-section'
import { SidePanel } from './components/side-panel'
import { useDebouncedBounds } from './hooks/use-debounced-bounds'
import { usePickupPoints } from './hooks/use-pickup-points'
import { geocodeAddress } from './services/geocoding-service'
import type { PickupPoint } from './types/pickup-point'
import type { SearchTarget } from './types/ui'
import { configureLeafletDefaultIcon } from './utils/leaflet-default-icon'
import { sortOpeningHours } from './utils/opening-hours'

configureLeafletDefaultIcon()

function App() {
  const [activePoint, setActivePoint] = useState<PickupPoint | null>(null)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchTarget, setSearchTarget] = useState<SearchTarget | null>(null)

  const { queryBounds, onBoundsChanged } = useDebouncedBounds(APP_CONFIG.boundsDebounceMs)
  const { pickupPoints, loading, loadingSummary, loadingProgress, error } = usePickupPoints(queryBounds)

  const pointCountLabel = useMemo(() => `${pickupPoints.length.toLocaleString('hu-HU')} pont`, [pickupPoints.length])

  const progressLabel = useMemo(() => {
    if (!loadingProgress) {
      return ''
    }

    const targetLabel = loadingProgress.target || loadingProgress.total
    if (!targetLabel) {
      return 'Betöltés előkészítése...'
    }

    return `Betöltve: ${loadingProgress.loaded} / ${targetLabel}`
  }, [loadingProgress])

  const orderedOpeningHours = useMemo(() => {
    if (!activePoint?.openingHours.length) {
      return []
    }

    return sortOpeningHours(activePoint.openingHours)
  }, [activePoint])

  const onSearchSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const term = searchText.trim()

      if (!term) {
        return
      }

      setSearching(true)
      setSearchError(null)

      try {
        const [lat, lon] = await geocodeAddress(term)

        setSearchTarget({
          center: [lat, lon],
          zoom: SEARCH_CONFIG.flyToZoom,
          token: Date.now(),
        })
      } catch (searchRequestError) {
        setSearchError((searchRequestError as Error).message)
      } finally {
        setSearching(false)
      }
    },
    [searchText],
  )

  return (
    <main className="layout">
      <MapSection
        pointCountLabel={pointCountLabel}
        progressLabel={progressLabel}
        loading={loading}
        loadingSummary={loadingSummary}
        loadingProgress={loadingProgress}
        error={error}
        mapError={mapError}
        searchText={searchText}
        searching={searching}
        searchError={searchError}
        selectedPointId={selectedPointId}
        searchTarget={searchTarget}
        pickupPoints={pickupPoints}
        onSearchTextChange={setSearchText}
        onSearchSubmit={onSearchSubmit}
        onBoundsChanged={onBoundsChanged}
        onPointSelect={setActivePoint}
        onMapTileError={() => {
          setMapError('A térkép csempéi nem töltődtek be. Ellenőrizd a hálózatot.')
        }}
      />

      <SidePanel
        activePoint={activePoint}
        orderedOpeningHours={orderedOpeningHours}
        selectedPointId={selectedPointId}
        onSelectPoint={setSelectedPointId}
      />
    </main>
  )
}

export default App
