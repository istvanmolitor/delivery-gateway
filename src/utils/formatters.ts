import type { Address, Time } from '../types/pickup-point'

export function formatTime(value: Time): string {
  const hour = `${value.hour}`.padStart(2, '0')
  const minute = `${value.minute}`.padStart(2, '0')
  return `${hour}:${minute}`
}

export function formatAddress(address: Address): string {
  const parts = [
    address.postalCode,
    address.city,
    address.addressLine1,
    address.addressLine2,
    address.country,
  ].filter(Boolean)

  return parts.join(', ')
}
