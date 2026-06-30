import { googleMapsApiKey, isGoogleMapsConfigured } from './mapsConfig.js'

let loadPromise = null

/** Carga el SDK de Google Maps (una sola vez). */
export function loadGoogleMaps() {
  if (!isGoogleMapsConfigured) {
    return Promise.reject(new Error('maps_not_configured'))
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const id = 'google-maps-sdk'
    if (document.getElementById(id)) {
      const wait = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(wait)
          resolve(window.google.maps)
        }
      }, 50)
      setTimeout(() => {
        clearInterval(wait)
        reject(new Error('maps_load_timeout'))
      }, 15000)
      return
    }

    const script = document.createElement('script')
    script.id = id
    script.async = true
    script.defer = true
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsApiKey)}` +
      '&language=es&region=PE'
    script.onload = () => {
      if (window.google?.maps) resolve(window.google.maps)
      else reject(new Error('maps_sdk_missing'))
    }
    script.onerror = () => reject(new Error('maps_script_error'))
    document.head.appendChild(script)
  })

  return loadPromise
}

/** URL para abrir Google Maps externo (fallback sin SDK). */
export function externalMapsUrl(stop) {
  if (stop.lat && stop.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`
  }
  const q = encodeURIComponent(
    `${stop.direccion || stop.distrito || stop.cliente_nombre}, Peru`,
  )
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

/** Ruta con varias paradas en Google Maps (app/web). */
export function externalDirectionsUrl(stops) {
  const withCoords = stops.filter((s) => s.lat && s.lng)
  if (withCoords.length === 0) return 'https://www.google.com/maps'
  if (withCoords.length === 1) {
    return externalMapsUrl(withCoords[0])
  }
  const origin = `${withCoords[0].lat},${withCoords[0].lng}`
  const dest = `${withCoords[withCoords.length - 1].lat},${withCoords[withCoords.length - 1].lng}`
  const waypoints = withCoords
    .slice(1, -1)
    .map((s) => `${s.lat},${s.lng}`)
    .join('|')
  let url =
    `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`
  if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`
  return url
}
