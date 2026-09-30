import { createClient } from '@supabase/supabase-js';

/**
 * Cliente con service role: salta RLS.
 * SOLO para webhooks y tareas de servidor. Nunca lo importes en un
 * componente cliente: la clave acabaría expuesta en el bundle.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
