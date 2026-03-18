export type SearchTarget = {
  center: [number, number]
  zoom: number
  token: number
}

export type LoadingProgress = {
  loaded: number
  total: number
  target: number
  percent: number
}
