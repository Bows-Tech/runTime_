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

  const patch: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUS.includes(body.status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }
    patch.status = body.status;
  }

  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.slug === 'string' && body.slug.trim()) patch.slug = body.slug.trim();

  // La categoría se puede cambiar o crear desde el desplegable. Vacía se
  // ignora en vez de dejar el script sin clasificar.
  if (typeof body.category === 'string' && body.category.trim()) {
    patch.category = body.category.trim().slice(0, 40);
  }

  if (body.priceCents !== undefined) {
    const cents = Number(body.priceCents);
    if (!Number.isInteger(cents) || cents < 0) {
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 });
    }
    patch.price_cents = cents;
  }

  if (body.descriptionEs !== undefined || body.descriptionEn !== undefined) {
    patch.description = {
      es: body.descriptionEs ?? '',
      en: body.descriptionEn ?? '',
    };
  }

  if (body.filePath !== undefined) {
    patch.file_path = body.filePath || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
  }

  patch.updated_at = new Date().toISOString();

  const supabase = await createClient();

  const { error } = await supabase.from('scripts').update(patch).eq('id', id);

  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? 'Ese slug ya existe' : error.message },
      { status },
    );
  }

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

  // Soft delete: conservamos el histórico de ventas (order_items guarda
  // el nombre, y el FK está en ON DELETE SET NULL).
  const { error } = await supabase
    .from('scripts')
    .update({ status: 'archivado', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
