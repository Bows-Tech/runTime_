import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  let email = '';
  try {
    const body = await request.json();
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  const supabase = await createClient();

  // `upsert` con ignoreDuplicates evita que alguien suscriba dos veces
  // y genere un error 500 visible.
  const { error } = await supabase
    .from('subscribers')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
