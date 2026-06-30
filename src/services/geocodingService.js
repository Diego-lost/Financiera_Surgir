import { googleMapsApiKey, isGoogleMapsConfigured } from '../lib/mapsConfig.js'

async function mapsGet(path, params) {
  const url = new URL(`https://maps.googleapis.com/maps/api/${path}`)
  url.searchParams.set('key', googleMapsApiKey)
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') url.searchParams.set(k, String(v))
  })
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

/** Autocompletado de direcciones (Places API). */
export async function autocompleteAddress(input) {
  if (!isGoogleMapsConfigured || !input || input.trim().length < 3) return []

  const data = await mapsGet('place/autocomplete/json', {
    input: input.trim(),
    language: 'es',
    components: 'country:pe',
  })
  if (!data || (data.status !== 'OK' && data.status !== 'ZERO_RESULTS')) return []

  return (data.predictions || [])
    .map((p) => ({
      description: p.description,
      placeId: p.place_id,
    }))
    .filter((p) => p.description && p.placeId)
}

/** Resuelve place_id → lat, lng y dirección formateada. */
export async function resolvePlace(placeId) {
  if (!isGoogleMapsConfigured || !placeId) return null

  const data = await mapsGet('place/details/json', {
    place_id: placeId,
    language: 'es',
    fields: 'geometry,formatted_address',
  })
  if (!data || data.status !== 'OK') return null

  const loc = data.result?.geometry?.location
  if (!loc) return null

  return {
    lat: Number(loc.lat),
    lng: Number(loc.lng),
    formattedAddress: data.result.formatted_address || '',
  }
}

/** Geocodifica texto de dirección → coordenadas. */
export async function geocodeAddress(address) {
  if (!isGoogleMapsConfigured || !address?.trim()) return null

  const data = await mapsGet('geocode/json', {
    address: address.trim(),
    language: 'es',
    region: 'pe',
  })
  if (!data || data.status !== 'OK' || !data.results?.length) return null

  const first = data.results[0]
  const loc = first.geometry?.location
  if (!loc) return null

  return {
    lat: Number(loc.lat),
    lng: Number(loc.lng),
    formattedAddress: first.formatted_address || address,
  }
}

/** Coordenadas → dirección (reverse geocode). */
export async function reverseGeocode(lat, lng) {
  if (!isGoogleMapsConfigured || lat == null || lng == null) return null

  const data = await mapsGet('geocode/json', {
    latlng: `${lat},${lng}`,
    language: 'es',
  })
  if (!data || data.status !== 'OK' || !data.results?.length) return null

  return {
    lat: Number(lat),
    lng: Number(lng),
    formattedAddress: data.results[0].formatted_address || '',
  }
}
