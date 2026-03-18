const DEFAULT_POINTS_STEP_SIZE = 20
const DEFAULT_MAX_POINTS_TO_RENDER = 60
const DEFAULT_BOUNDS_DEBOUNCE_MS = 60

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const API_CONFIG = {
  graphqlEndpoint: 'https://api.beta.deliverygateway.io/graphql/public',
  merchantId: 'e7e84b82-cf23-4640-80c4-2760b09190c9',
  sessionId: '9f2bb9e8-6653-482d-a953-3932f68dd07a',
}

export const MAP_CONFIG = {
  defaultCenter: [47.4979, 19.0402] as [number, number],
  defaultZoom: 12,
  minZoom: 4,
  maxZoom: 18,
  tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
}

export const SEARCH_CONFIG = {
  geocodingUrl: 'https://nominatim.openstreetmap.org/search',
  geocodingFormat: 'jsonv2',
  geocodingLimit: '1',
  flyToZoom: 14,
}

export const APP_CONFIG = {
  pointsStepSize: toPositiveInt(import.meta.env.VITE_POINTS_STEP_SIZE, DEFAULT_POINTS_STEP_SIZE),
  maxPointsToRender: toPositiveInt(import.meta.env.VITE_MAX_POINTS_TO_RENDER, DEFAULT_MAX_POINTS_TO_RENDER),
  boundsDebounceMs: toPositiveInt(import.meta.env.VITE_BOUNDS_DEBOUNCE_MS, DEFAULT_BOUNDS_DEBOUNCE_MS),
}
