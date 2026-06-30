import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Route, MapPin, RefreshCw, ExternalLink, Navigation } from 'lucide-react'
import PageHead from '../components/layout/PageHead.jsx'
import Loader from '../components/ui/Loader.jsx'
import Alert from '../components/ui/Alert.jsx'
import Badge from '../components/ui/Badge.jsx'
import Money from '../components/ui/Money.jsx'
import RouteDayMap from '../components/maps/RouteDayMap.jsx'
import { listarCartera } from '../services/carteraService.js'
import { isGoogleMapsConfigured } from '../lib/mapsConfig.js'
import { externalMapsUrl, externalDirectionsUrl } from '../lib/loadGoogleMaps.js'
import { extractError, humanizar } from '../utils/format.js'

export default function RutaPage() {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const [stops, setStops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mapOk, setMapOk] = useState(false)

  const cargar = () => {
    setLoading(true)
    setError(null)
    listarCartera()
      .then((data) => setStops(data || []))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const openStopOnMap = (stop) => {
    const coordIdx = stopsConCoords.findIndex((s) => s.id === stop.id)
    if (mapOk && coordIdx >= 0) {
      mapRef.current?.focusStop(coordIdx)
      document.getElementById('route-day-map-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    window.open(externalMapsUrl(stop), '_blank', 'noopener,noreferrer')
  }

  const stopsConCoords = stops.filter((s) => s.lat && s.lng)

  return (
    <>
      <PageHead
        title="Planificación de ruta"
        subtitle="Paradas del día ordenadas por prioridad (misma fuente que la app)."
        icon={Route}
        actions={
          <button className="hb-btn hb-btn-gray hb-btn-sm" onClick={cargar}>
            <RefreshCw size={15} /> Actualizar
          </button>
        }
      />
      {error && <Alert tipo="error">{error}</Alert>}

      {loading ? (
        <Loader text="Cargando ruta del día…" />
      ) : stops.length === 0 ? (
        <div className="hb-card hb-table-empty">No hay paradas programadas para hoy.</div>
      ) : (
        <>
          {isGoogleMapsConfigured && stopsConCoords.length > 0 && (
            <div id="route-day-map-wrap" className="hb-card route-map-card">
              <div className="route-map-card-head">
                <strong>Mapa de la ruta</strong>
                <span>{stopsConCoords.length} paradas con ubicación GPS</span>
                {stopsConCoords.length > 1 && (
                  <a
                    className="hb-btn hb-btn-gray hb-btn-sm"
                    href={externalDirectionsUrl(stopsConCoords)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation size={14} /> Abrir ruta completa en Maps
                  </a>
                )}
              </div>
              <RouteDayMap
                ref={mapRef}
                stops={stopsConCoords}
                onReady={(ok = true) => setMapOk(ok !== false)}
              />
            </div>
          )}

          {!isGoogleMapsConfigured && (
            <Alert tipo="warn">
              Agrega <code>VITE_GOOGLE_MAPS_API_KEY</code> en .env (misma clave que la app Fuerza de Ventas)
              para ver el mapa embebido aquí.
            </Alert>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stops.map((stop, idx) => (
              <div key={stop.id} className="hb-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--hb-muted)', marginBottom: 4 }}>
                      Parada {idx + 1} · Score {stop.score_prioridad}
                    </div>
                    <strong style={{ fontSize: 16 }}>{stop.cliente_nombre}</strong>
                    <div style={{ fontSize: 13, color: 'var(--hb-muted)', marginTop: 4 }}>
                      DNI {stop.documento} · {humanizar(stop.tipo_gestion)}
                      {stop.es_nueva_solicitud && (
                        <Badge estado="pendiente" style={{ marginLeft: 8 }}>Nueva solicitud</Badge>
                      )}
                    </div>
                    {stop.distrito && (
                      <div style={{ fontSize: 13, marginTop: 4 }}>
                        <MapPin size={13} style={{ verticalAlign: -2 }} /> {stop.distrito}
                      </div>
                    )}
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      Saldo cuenta: <Money value={stop.saldo_cuenta} />
                    </div>
                    {stop.solicitud_monto > 0 && (
                      <div style={{ fontSize: 13, marginTop: 4 }}>
                        Solicitud: <Money value={stop.solicitud_monto} /> · {stop.solicitud_plazo} meses
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <button
                      type="button"
                      className="hb-btn hb-btn-gray hb-btn-sm"
                      onClick={() => openStopOnMap(stop)}
                    >
                      <ExternalLink size={14} /> Maps
                    </button>
                    <button
                      className="hb-btn hb-btn-sm"
                      onClick={() => navigate(`/clientes/${stop.cliente_id}/ficha`)}
                    >
                      Ficha
                    </button>
                    <button className="hb-btn hb-btn-ghost hb-btn-sm" onClick={() => navigate('/cartera')}>
                      Gestionar visita
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
