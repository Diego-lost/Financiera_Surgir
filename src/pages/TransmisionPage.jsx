import { useState, useEffect } from 'react'
import { CloudUpload, RefreshCw } from 'lucide-react'
import PageHead from '../components/layout/PageHead.jsx'
import Card from '../components/ui/Card.jsx'
import Alert from '../components/ui/Alert.jsx'
import Loader from '../components/ui/Loader.jsx'
import { transmitirPendientes } from '../services/fventasService.js'
import { listarSolicitudes } from '../services/solicitudesService.js'
import { extractError } from '../utils/format.js'

export default function TransmisionPage() {
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [pendientes, setPendientes] = useState([])
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const cargar = async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await listarSolicitudes()
      setPendientes(
        all.filter((s) =>
          ['pendiente', 'aprobado'].includes(s.estado),
        ),
      )
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  const transmitir = async () => {
    setTxLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await transmitirPendientes()
      setResult(res)
      await cargar()
    } catch (err) {
      setError(extractError(err))
    } finally {
      setTxLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  return (
    <>
      <PageHead
        title="Transmisión electrónica"
        subtitle="Envía solicitudes y documentos al sistema central (igual que la app móvil)."
        icon={CloudUpload}
        actions={
          <button className="hb-btn hb-btn-gray hb-btn-sm" onClick={cargar}>
            <RefreshCw size={15} /> Actualizar
          </button>
        }
      />

      {error && <Alert tipo="error">{error}</Alert>}
      {result && (
        <Alert tipo="success">
          Transmitido: {result.solicitudes_transmitidas} solicitud(es),{' '}
          {result.documentos_transmitidos} documento(s),{' '}
          {result.desembolsos_reflejados} desembolso(s).
        </Alert>
      )}

      <Card title="Pendientes por transmitir" icon={CloudUpload}>
        {loading ? (
          <Loader text="Cargando…" />
        ) : pendientes.length === 0 ? (
          <p style={{ color: 'var(--hb-muted)' }}>No hay solicitudes pendientes de transmisión.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {pendientes.map((s) => (
              <li key={s.id} style={{ marginBottom: 8 }}>
                <strong>{s.cliente_nombre}</strong> — S/ {s.monto_solicitado} ({s.estado})
              </li>
            ))}
          </ul>
        )}
        <button
          className="hb-btn"
          style={{ marginTop: 16 }}
          onClick={transmitir}
          disabled={txLoading || pendientes.length === 0}
        >
          <CloudUpload size={16} /> {txLoading ? 'Transmitiendo…' : 'Transmitir pendientes'}
        </button>
      </Card>
    </>
  )
}
