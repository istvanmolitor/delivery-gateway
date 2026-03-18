import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import './App.css'

const GRAPHQL_ENDPOINT = 'https://api.beta.deliverygateway.io/graphql/public'
const MERCHANT_ID = 'e7e84b82-cf23-4640-80c4-2760b09190c9'
const SESSION_ID = '9f2bb9e8-6653-482d-a953-3932f68dd07a'

const DEFAULT_CENTER: [number, number] = [47.4979, 19.0402]
const DEFAULT_ZOOM = 12
const REQUEST_BATCH_SIZE = 700
const MAX_POINTS_TO_RENDER = 5000
const BOUNDS_DEBOUNCE_MS = 400

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Hétfő',
  TUESDAY: 'Kedd',
  WEDNESDAY: 'Szerda',
  THURSDAY: 'Csütörtök',
  FRIDAY: 'Péntek',
  SATURDAY: 'Szombat',
  SUNDAY: 'Vasárnap',
}

const DAY_ORDER: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
}

type Time = {
  hour: number
  minute: number
}

type OpeningHour = {
  day: string
  start: Time
  end: Time
}

type Address = {
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  postalCode: string | null
  country: string | null
}

type Location = {
  latitude: number
  longitude: number
}

type PickupPoint = {
  id: string
  pid: number
  name: string
  type: string
  isOpen: boolean
  openingHours: OpeningHour[]
  address: Address
  location: Location
}

type BoundingBox = {
  southWest: Location
  northEast: Location
}

type PaginatorInfo = {
  total: number
  hasMorePages: boolean
}

type PickupPointsPage = {
  paginatorInfo: PaginatorInfo
  data: PickupPoint[]
}

type GraphQLErrorResponse = {
  errors?: Array<{ message: string }>
}

type PickupPointsResponse = GraphQLErrorResponse & {
  data?: {
    session?: {
      pickupPoint?: {
        pickupPoints?: {
          points?: PickupPointsPage
        }
      }
    }
  }
}

type SearchTarget = {
  center: [number, number]
  zoom: number
  token: number
}

type NominatimResult = {
  lat: string
  lon: string
}

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

async function fetchPickupPointsPage(
  page: number,
  bounds: BoundingBox,
  signal: AbortSignal,
): Promise<PickupPointsPage> {
  const query = `
    query PickupPoints($sessionId: ID!, $page: Int!, $first: Int!, $filters: PickupPointFilterInput) {
      session(id: $sessionId) {
        pickupPoint {
          pickupPoints(filters: $filters) {
            points(first: $first, page: $page) {
              paginatorInfo {
                total
                hasMorePages
              }
              data {
                id
                pid
                name
                type
                isOpen
                openingHours {
                  day
                  start { hour minute }
                  end { hour minute }
                }
                address {
                  addressLine1
                  addressLine2
                  city
                  postalCode
                  country
                }
                location {
                  latitude
                  longitude
                }
              }
            }
          }
        }
      }
    }
  `

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Deliverygateway-Io': MERCHANT_ID,
    },
    body: JSON.stringify({
      query,
      variables: {
        sessionId: SESSION_ID,
        page,
        first: REQUEST_BATCH_SIZE,
        filters: {
          boundingBox: bounds,
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL HTTP hiba: ${response.status}`)
  }

  const payload = (await response.json()) as PickupPointsResponse
  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors[0].message)
  }

  const points = payload.data?.session?.pickupPoint?.pickupPoints?.points
  if (!points) {
    throw new Error('A GraphQL válasz nem tartalmazott csomagpont adatot.')
  }

  return points
}

function toBoundingBox(bounds: L.LatLngBounds): BoundingBox {
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

function hasSignificantBoundsChange(previous: BoundingBox | null, next: BoundingBox): boolean {
  if (!previous) {
    return true
  }

  const threshold = 0.003
  return (
    Math.abs(previous.southWest.latitude - next.southWest.latitude) > threshold ||
    Math.abs(previous.southWest.longitude - next.southWest.longitude) > threshold ||
    Math.abs(previous.northEast.latitude - next.northEast.latitude) > threshold ||
    Math.abs(previous.northEast.longitude - next.northEast.longitude) > threshold
  )
}

function formatTime(value: Time): string {
  const hour = `${value.hour}`.padStart(2, '0')
  const minute = `${value.minute}`.padStart(2, '0')
  return `${hour}:${minute}`
}

function formatAddress(address: Address): string {
  const parts = [
    address.postalCode,
    address.city,
    address.addressLine1,
    address.addressLine2,
    address.country,
  ].filter(Boolean)

  return parts.join(', ')
}

function FlyToTarget({ target }: { target: SearchTarget | null }) {
  const map = useMap()

  useEffect(() => {
    if (!target) {
      return
    }
    map.flyTo(target.center, target.zoom, { duration: 0.9 })
  }, [map, target])

  return null
}

function MapBoundsWatcher({ onBoundsChanged }: { onBoundsChanged: (bounds: BoundingBox) => void }) {
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

function App() {
  const [queryBounds, setQueryBounds] = useState<BoundingBox | null>(null)
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([])
  const [activePoint, setActivePoint] = useState<PickupPoint | null>(null)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchTarget, setSearchTarget] = useState<SearchTarget | null>(null)
  const debounceTimerRef = useRef<number | null>(null)
  const lastMapBoundsRef = useRef<BoundingBox | null>(null)

  const onBoundsChanged = useCallback((nextBounds: BoundingBox) => {
    if (!hasSignificantBoundsChange(lastMapBoundsRef.current, nextBounds)) {
      return
    }

    lastMapBoundsRef.current = nextBounds
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = window.setTimeout(() => {
      setQueryBounds(nextBounds)
    }, BOUNDS_DEBOUNCE_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!queryBounds) {
      return
    }

    const controller = new AbortController()

    const loadPoints = async () => {
      setLoading(true)
      setError(null)
      setLoadingSummary('Csomagpontok betöltése...')

      try {
        let currentPage = 1
        let hasMorePages = true
        let total = 0
        const byId = new Map<string, PickupPoint>()

        while (hasMorePages && byId.size < MAX_POINTS_TO_RENDER) {
          const pageResult = await fetchPickupPointsPage(currentPage, queryBounds, controller.signal)
          hasMorePages = pageResult.paginatorInfo.hasMorePages
          total = pageResult.paginatorInfo.total

          for (const point of pageResult.data) {
            byId.set(point.id, point)
          }

          const partialResult = Array.from(byId.values())
          setPickupPoints(partialResult)
          setLoadingSummary(`Betöltve: ${partialResult.length} / ${total}`)
          currentPage += 1
        }

        const result = Array.from(byId.values())
        setPickupPoints(result)
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

  const pointCountLabel = useMemo(() => `${pickupPoints.length.toLocaleString('hu-HU')} pont`, [pickupPoints.length])
  const orderedOpeningHours = useMemo(() => {
    if (!activePoint?.openingHours.length) {
      return []
    }
    return [...activePoint.openingHours].sort((a, b) => (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99))
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
        const url = new URL('https://nominatim.openstreetmap.org/search')
        url.searchParams.set('q', term)
        url.searchParams.set('format', 'jsonv2')
        url.searchParams.set('limit', '1')

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Geokódolási hiba: ${response.status}`)
        }

        const results = (await response.json()) as NominatimResult[]
        if (!results.length) {
          throw new Error('Nincs találat a megadott címre vagy városra.')
        }

        const firstResult = results[0]
        setSearchTarget({
          center: [Number(firstResult.lat), Number(firstResult.lon)],
          zoom: 14,
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
      <section className="map-section">
        <header className="toolbar">
          <h1>Csomagautomata kereső</h1>
          <form className="search-form" onSubmit={onSearchSubmit}>
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Város vagy cím (pl. Budapest, Deák tér)"
              aria-label="Város vagy cím"
            />
            <button type="submit" disabled={searching}>
              {searching ? 'Keresés...' : 'Keresés'}
            </button>
          </form>
          {searchError ? <p className="warning">{searchError}</p> : null}
          <div className="status-row">
            <span>{pointCountLabel}</span>
            {loading || loadingSummary ? <span>{loading ? loadingSummary : loadingSummary}</span> : null}
            {selectedPointId ? <span>Kiválasztott azonosító: {selectedPointId}</span> : null}
          </div>
        </header>

        <div className="map-shell">
          <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} minZoom={4} zoomControl={true} maxZoom={18}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              eventHandlers={{
                tileerror: () => {
                  setMapError('A térkép csempéi nem töltődtek be. Ellenőrizd a hálózatot.')
                },
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
                      setActivePoint(point)
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

      <aside className="side-panel">
        {activePoint ? (
          <>
            <h2>{activePoint.name}</h2>
            <p className="meta">{activePoint.type}</p>
            <p>{formatAddress(activePoint.address)}</p>
            <p>{activePoint.isOpen ? 'Jelenleg nyitva' : 'Jelenleg zárva'}</p>
            <h3>Nyitvatartás</h3>
            <ul className="hours-list">
              {orderedOpeningHours.length ? (
                orderedOpeningHours.map((entry) => (
                  <li key={`${entry.day}-${entry.start.hour}-${entry.start.minute}`}>
                    <span>{DAY_LABELS[entry.day] ?? entry.day}</span>
                    <span>
                      {formatTime(entry.start)} - {formatTime(entry.end)}
                    </span>
                  </li>
                ))
              ) : (
                <li>Nincs nyitvatartási adat</li>
              )}
            </ul>
            <button className="select-button" onClick={() => setSelectedPointId(activePoint.id)} type="button">
              {selectedPointId === activePoint.id ? 'Kiválasztva' : 'Kiválasztom ezt a pontot'}
            </button>
          </>
        ) : (
          <>
            <h2>Nincs kiválasztott pont</h2>
            <p>Kattints egy markerre a térképen a részletek megjelenítéséhez.</p>
          </>
        )}
      </aside>
    </main>
  )
}

export default App
