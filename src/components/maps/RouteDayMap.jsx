import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react'
import { loadGoogleMaps } from '../../lib/loadGoogleMaps.js'

const LIMA_CENTER = { lat: -12.0464, lng: -77.0428 }

const RouteDayMap = forwardRef(function RouteDayMap({ stops, onReady }, ref) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  useImperativeHandle(ref, () => ({
    focusStop(index) {
      const marker = markersRef.current[index]
      if (!marker || !mapRef.current) return
      const pos = marker.getPosition()
      if (!pos) return
      mapRef.current.panTo(pos)
      mapRef.current.setZoom(16)
      marker.setAnimation(window.google.maps.Animation.BOUNCE)
      setTimeout(() => marker.setAnimation(null), 1600)
    },
  }))

  useEffect(() => {
    let cancelled = false
    const withCoords = stops.filter((s) => s.lat && s.lng)

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return

        markersRef.current.forEach((m) => m.setMap(null))
        markersRef.current = []

        if (!mapRef.current) {
          mapRef.current = new maps.Map(containerRef.current, {
            center: withCoords.length
              ? { lat: withCoords[0].lat, lng: withCoords[0].lng }
              : LIMA_CENTER,
            zoom: withCoords.length ? 13 : 6,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          })
        }

        const bounds = new maps.LatLngBounds()

        withCoords.forEach((stop, idx) => {
          const marker = new maps.Marker({
            map: mapRef.current,
            position: { lat: stop.lat, lng: stop.lng },
            label: {
              text: String(idx + 1),
              color: '#fff',
              fontWeight: '700',
            },
            title: stop.cliente_nombre || `Parada ${idx + 1}`,
          })
          markersRef.current.push(marker)
          bounds.extend({ lat: stop.lat, lng: stop.lng })
        })

        if (withCoords.length > 1) {
          mapRef.current.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 })
        } else if (withCoords.length === 1) {
          mapRef.current.setCenter({ lat: withCoords[0].lat, lng: withCoords[0].lng })
          mapRef.current.setZoom(15)
        }

        onReady?.()
      })
      .catch(() => {
        onReady?.(false)
      })

    return () => {
      cancelled = true
    }
  }, [stops, onReady])

  return <div ref={containerRef} className="route-day-map" aria-label="Mapa de paradas del día" />
})

export default RouteDayMap
