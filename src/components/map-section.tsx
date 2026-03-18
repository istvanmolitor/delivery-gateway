import type { FormEvent } from 'react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import { MAP_CONFIG } from '../config'
import type { BoundingBox, PickupPoint } from '../types/pickup-point'
import type { LoadingProgress, SearchTarget } from '../types/ui'
import { FlyToTarget } from './map/fly-to-target'
import { MapBoundsWatcher } from './map/map-bounds-watcher'

type MapSectionProps = {
  pointCountLabel: string
  progressLabel: string
  loading: boolean
  loadingSummary: string
  loadingProgress: LoadingProgress | null
  error: string | null
  mapError: string | null
  searchText: string
  searching: boolean
  searchError: string | null
  selectedPointId: string | null
  searchTarget: SearchTarget | null
  pickupPoints: PickupPoint[]
  onSearchTextChange: (value: string) => void
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void
  onBoundsChanged: (bounds: BoundingBox) => void
  onPointSelect: (point: PickupPoint) => void
  onMapTileError: () => void
}

export function MapSection({
  pointCountLabel,
  progressLabel,
  loading,
  loadingSummary,
  loadingProgress,
  error,
  mapError,
  searchText,
  searching,
  searchError,
  selectedPointId,
  searchTarget,
  pickupPoints,
  onSearchTextChange,
  onSearchSubmit,
  onBoundsChanged,
  onPointSelect,
  onMapTileError,
}: MapSectionProps) {
  return (
    <section className="map-section">
      <header className="toolbar">
        <h1>Csomagautomata kereső</h1>
        <form className="search-form" onSubmit={onSearchSubmit}>
          <input
            type="text"
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder="Város vagy cím (pl. Budapest, Deák tér)"
            aria-label="Város vagy cím"
          />
          <button type="submit" disabled={searching}>
            {searching ? 'Keresés...' : 'Keresés'}
          </button>
        </form>
        {loadingProgress ? (
          <div className="progress-block" role="status" aria-live="polite">
            <div className="progress-head">
              <span>{progressLabel}</span>
              <span>{loadingProgress.percent}%</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={loadingProgress.percent}
              aria-label="Csomagpont betöltés állapota"
            >
              <div className="progress-fill" style={{ width: `${loadingProgress.percent}%` }} />
            </div>
          </div>
        ) : null}
        {searchError ? <p className="warning">{searchError}</p> : null}
        <div className="status-row">
          <span>{pointCountLabel}</span>
          {loading || loadingSummary ? <span>{loading ? loadingSummary : loadingSummary}</span> : null}
          {selectedPointId ? <span>Kiválasztott azonosító: {selectedPointId}</span> : null}
        </div>
      </header>

      <div className="map-shell">
        <MapContainer
          center={MAP_CONFIG.defaultCenter}
          zoom={MAP_CONFIG.defaultZoom}
          minZoom={MAP_CONFIG.minZoom}
          zoomControl={true}
          maxZoom={MAP_CONFIG.maxZoom}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={MAP_CONFIG.tileLayerUrl}
            eventHandlers={{
              tileerror: onMapTileError,
            }}
          />
          <MapBoundsWatcher onBoundsChanged={onBoundsChanged} />
          <FlyToTarget target={searchTarget} />
          <MarkerClusterGroup chunkedLoading maxClusterRadius={70}>
            {pickupPoints.map((point) => (
              <Marker
                key={point.id}
                position={[point.location.latitude, point.location.longitude]}
                eventHandlers={{
                  click: () => {
                    onPointSelect(point)
                  },
                }}
              />
            ))}
          </MarkerClusterGroup>
        </MapContainer>

        {loading ? <div className="map-overlay">Adatok betöltése...</div> : null}
        {error ? <div className="map-overlay map-overlay-error">{error}</div> : null}
        {mapError ? <div className="map-overlay map-overlay-error">{mapError}</div> : null}
      </div>
    </section>
  )
}
