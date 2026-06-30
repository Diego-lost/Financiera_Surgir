/** Misma clave que GOOGLE_MAPS_API_KEY en Aplicacion banco 2/.env */
export const googleMapsApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim()

export const isGoogleMapsConfigured = googleMapsApiKey.length > 0
