import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const VALID_STATUS = ['borrador', 'publicado', 'archivado'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status !== undefined) {
    if (!VALID_STATUS.includes(body.status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }
    patch.status = body.status;
    // Al publicar por primera vez, sellamos la fecha.
    if (body.status === 'publicado') patch.published_at = new Date().toISOString();
  }

  if (typeof body.title === 'string' && body.title.trim()) {
    patch.title = { es: body.title.trim(), en: body.titleEn ?? body.title.trim() };
  }

  const supabase = await createClient();

  const { error } = await supabase.from('publications').update(patch).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('publications').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
