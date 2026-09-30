import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';

  if (!title || !slug) {
    return NextResponse.json({ error: 'Título y slug son obligatorios' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('publications')
    .insert({
      title: { es: title, en: body.titleEn ?? title },
      slug,
      body: body.body ?? {},
      status: 'borrador',
    })
    .select('id')
    .single();

  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? 'Ese slug ya existe' : error.message },
      { status },
    );
  }

  return NextResponse.json({ id: data.id });
}
