export type Time = {
  hour: number
  minute: number
}

export type OpeningHour = {
  day: string
  start: Time
  end: Time
}

export type Address = {
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  postalCode: string | null
  country: string | null
}

export type GeoLocation = {
  latitude: number
  longitude: number
}

export type PickupPoint = {
  id: string
  pid: number
  name: string
  type: string
  isOpen: boolean
  openingHours: OpeningHour[]
  address: Address
  location: GeoLocation
}

export type BoundingBox = {
  southWest: GeoLocation
  northEast: GeoLocation
}

export type PaginatorInfo = {
  total: number
  hasMorePages: boolean
}

export type PickupPointsPage = {
  paginatorInfo: PaginatorInfo
  data: PickupPoint[]
}
