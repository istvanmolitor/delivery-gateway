import { API_CONFIG, APP_CONFIG } from '../config'
import type { BoundingBox, PickupPointsPage } from '../types/pickup-point'

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

const PICKUP_POINTS_QUERY = `
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

export async function fetchPickupPointsPage(
  page: number,
  bounds: BoundingBox,
  signal: AbortSignal,
): Promise<PickupPointsPage> {
  const response = await fetch(API_CONFIG.graphqlEndpoint, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Deliverygateway-Io': API_CONFIG.merchantId,
    },
    body: JSON.stringify({
      query: PICKUP_POINTS_QUERY,
      variables: {
        sessionId: API_CONFIG.sessionId,
        page,
        first: APP_CONFIG.pointsStepSize,
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
