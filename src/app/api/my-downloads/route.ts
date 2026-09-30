import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Devuelve los enlaces de descarga de las órdenes pagadas de un email.
 *
 * Usa service role porque la tabla download_tokens no tiene policies de
 * lectura (por diseño: los tokens nunca se consultan desde el cliente).
 * Por eso exigimos el email completo: sin esa condición, cualquiera podría
 * enumerar compras ajenas.
 */
export async function POST(request: Request) {
  let email = '';
  try {
    const body = await request.json();
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: tokens, error } = await supabase
    .from('download_tokens')
    .select('token, used, expires_at, scripts (name, extension)')
    .eq('email', email)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tokens: tokens ?? [] });
}
