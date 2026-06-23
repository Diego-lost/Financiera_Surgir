import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env — copia desde Aplicacion banco 2/.env',
  )
}

export const supabase = createClient(url || '', anonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

export function supabaseError(err, fallback = 'Ocurrió un error. Intente nuevamente.') {
  if (!err) return fallback
  if (typeof err === 'string') return err
  return err.message || err.error_description || fallback
}
