import { SEARCH_CONFIG } from '../config'

type NominatimResult = {
  lat: string
  lon: string
}

export async function geocodeAddress(term: string): Promise<[number, number]> {
  const url = new URL(SEARCH_CONFIG.geocodingUrl)
  url.searchParams.set('q', term)
  url.searchParams.set('format', SEARCH_CONFIG.geocodingFormat)
  url.searchParams.set('limit', SEARCH_CONFIG.geocodingLimit)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Geokódolási hiba: ${response.status}`)
  }

  const results = (await response.json()) as NominatimResult[]
  if (!results.length) {
    throw new Error('Nincs találat a megadott címre vagy városra.')
  }

  const firstResult = results[0]
  return [Number(firstResult.lat), Number(firstResult.lon)]
}
