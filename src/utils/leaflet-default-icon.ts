import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

let isConfigured = false

export function configureLeafletDefaultIcon(): void {
  if (isConfigured) {
    return
  }

  // Disable Leaflet's legacy path auto-detection to avoid duplicated URLs
  // like /node_modules/.../node_modules/.../marker-icon.png in Vite dev mode.
  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIconRetina,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  })

  // Marker has a pre-created default icon instance that does not pick up
  // mergeOptions changes automatically, so replace it explicitly.
  L.Marker.prototype.options.icon = new L.Icon.Default()

  isConfigured = true
}
