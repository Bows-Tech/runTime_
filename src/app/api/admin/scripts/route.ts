import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const priceCents = Number(body.priceCents);

  if (!name || !slug) {
    return NextResponse.json({ error: 'Nombre y slug son obligatorios' }, { status: 400 });
  }
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    return NextResponse.json({ error: 'Precio inválido' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('scripts')
    .insert({
      name,
      slug,
      extension: (body.extension || 'py').toString().slice(0, 8),
      price_cents: priceCents,
      category: (body.category || 'herramientas').toString().slice(0, 40),
      description: {
        es: body.descriptionEs ?? '',
        en: body.descriptionEn ?? '',
      },
      status: 'borrador',
    })
    .select('id')
    .single();

  if (error) {
    // 23505 = slug duplicado
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? 'Ese slug ya existe' : error.message },
      { status },
    );
  }

  return NextResponse.json({ id: data.id });
}
