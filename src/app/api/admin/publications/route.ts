import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const title = str(body.title);
  const slug = str(body.slug);

  if (!title || !slug) {
    return NextResponse.json({ error: 'Título y slug son obligatorios' }, { status: 400 });
  }

  // El terminal_lines solo acepta texto plano: se pinta dentro de un
  // <span>, no de un <pre> con HTML.
  const rawLines = Array.isArray(body.terminalLines) ? body.terminalLines : [];
  const lines = rawLines
    .filter((l: unknown): l is string => typeof l === 'string')
    .map((l: string) => l.trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, 12);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('publications')
    .insert({
      title: { es: title, en: str(body.titleEn) || title },
      subtitle: { es: str(body.subtitle), en: str(body.subtitleEn) },
      slug,
      eyebrow: str(body.eyebrow) || 'próximo lanzamiento',
      badge: str(body.badge) || null,
      terminal_title: str(body.terminalTitle) || null,
      terminal_lines: lines,
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