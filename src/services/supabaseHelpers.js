import { supabase } from '../lib/supabase.js'

/** Carga perfiles_clientes por user_id (evita joins sin FK en PostgREST). */
export async function fetchPerfilesMap(userIds) {
  const ids = [...new Set(userIds.filter(Boolean))]
  if (!ids.length) return {}

  const { data } = await supabase
    .from('perfiles_clientes')
    .select('user_id, dni, nombres, apellidos, telefono')
    .in('user_id', ids)

  return Object.fromEntries((data || []).map((p) => [p.user_id, p]))
}
