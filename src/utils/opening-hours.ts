import { DAY_ORDER } from '../constants/opening-hours'
import type { OpeningHour } from '../types/pickup-point'

export function sortOpeningHours(hours: OpeningHour[]): OpeningHour[] {
  return [...hours].sort((a, b) => (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99))
}
