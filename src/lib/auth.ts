import { cache } from 'react';
import { createClient } from './supabase/server';

/**
 * `cache()` de React memoiza por render/request. Sin esto, `isAdmin()`
 * hacía un viaje a Supabase Auth y otro a `profiles` en CADA llamada: el
 * layout, la página, y cada Route Handler la invocaban por separado.
 * Con cache, una request resuelve el usuario una sola vez.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

/**
 * Devuelve true solo si el usuario existe Y tiene is_admin.
 * Úsalo en cada ruta /admin y en cada handler de escritura.
 */
export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await getUser();
  if (!user) return false;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  return profile?.is_admin === true;
});

/** Lanza 403 si el usuario no es admin. Úsalo en Route Handlers. */
export async function requireAdmin(): Promise<Response | null> {
  if (await isAdmin()) return null;
  return Response.json({ error: 'No autorizado' }, { status: 403 });
}
