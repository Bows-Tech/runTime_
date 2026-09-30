import { createClient } from '@supabase/supabase-js';

/**
 * Cliente para leer catálogo público desde Server Components.
 *
 * Por qué existe: el cliente de `server.ts` llama a `cookies()`, y eso
 * marca la página como render dinámico. Cada visita a la home acababa
 * consultando Supabase y sirviéndose con `no-store`, anulando el
 * `revalidate` y el prerender estático.
 *
 * Este cliente no lee cookies, así que la página puede prerenderizarse.
 *
 * NO es un atajo de seguridad: sigue usando la clave anónima, así que
 * RLS se aplica igual. El rol `anon` solo ve `scripts` con
 * status = 'publicado' (policy `scripts_public_read`). Los borradores
 * siguen invisibles.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
