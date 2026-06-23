import { supabase, supabaseError } from '../lib/supabase.js'

function mapParada(p, idx) {
  const prioridad = Number(p.prioridad) || 0
  const diasMora = Number(p.dias_mora) || 0
  const esNueva = p.tipo_gestion === 'NUEVA_SOLICITUD'
  return {
    id: p.user_id || `ruta-${idx}`,
    cliente_id: p.user_id,
    cliente_nombre: `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim(),
    documento: p.dni,
    tipo_gestion: p.tipo_gestion || (diasMora > 30
      ? 'RECUPERACION_MORA'
      : diasMora > 0
        ? 'SEGUIMIENTO'
        : 'RENOVACION'),
    prioridad: prioridad >= 80 ? 'alta' : prioridad >= 60 ? 'media' : 'normal',
    score_prioridad: prioridad,
    monto_credito: p.solicitud_monto || 0,
    estado_visita: 'pendiente',
    lat: p.lat_negocio,
    lng: p.lng_negocio,
    telefono: p.telefono,
    distrito: p.distrito,
    solicitud_id: p.solicitud_id,
    solicitud_monto: p.solicitud_monto,
    solicitud_plazo: p.solicitud_plazo,
    solicitud_estado: p.solicitud_estado,
    es_nueva_solicitud: esNueva,
  }
}

/** Cartera del día — RPC asesor_get_ruta_dia (misma fuente que la app Flutter). */
export async function listarCartera() {
  const { data: raw, error } = await supabase.rpc('asesor_get_ruta_dia')
  if (error) throw new Error(supabaseError(error))
  if (!raw?.ok) throw new Error(raw?.error || 'No se pudo cargar la cartera.')

  const paradas = raw.paradas || []
  return paradas.map(mapParada)
}

/** Registra resultado de visita en la ficha de campo del cliente. */
export async function marcarVisita(carteraId, { resultado, observacion }) {
  const userId = carteraId
  const nota = observacion
    ? `[${resultado}] ${observacion}`
    : `Visita: ${resultado}`

  const { data: ficha } = await supabase
    .from('fichas_campo')
    .select('id')
    .eq('user_id', userId)
    .order('fecha_visita', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (ficha?.id) {
    const { error } = await supabase
      .from('fichas_campo')
      .update({
        recomendacion_asesor: nota,
        estado_ficha: resultado === 'visitado' ? 'completada' : 'en_proceso',
      })
      .eq('id', ficha.id)

    if (error) throw new Error(supabaseError(error, 'No se pudo registrar la visita.'))
  }

  return { ok: true, estado_visita: resultado }
}
