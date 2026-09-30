import type { Json } from './supabase/database.types';
import { createPublicClient } from './supabase/public';

/**
 * Publicaciones que alimentan la sección "próximo lanzamiento" de la home.
 *
 * Solo se lee la más reciente que esté publicada. Es una sola ranura:
 * si hay varias, gana la última por fecha de publicación.
 *
 * Usa el cliente público (sin cookies) para que la home siga siendo
 * prerenderizable y cacheable.
 */
export type HomePublication = {
  slug: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  badge: string | null;
  terminalTitle: string;
  terminalLines: string[];
};

const FALLBACK: Omit<HomePublication, 'slug'> = {
  title: 'Suite de automatización DevOps',
  subtitle:
    'Un set de scripts para CI/CD, despliegues sin downtime y rollback automático. Ya en pruebas internas.',
  eyebrow: 'próximo lanzamiento',
  badge: null,
  terminalTitle: 'devops-suite — preview',
  terminalLines: [
    'deploy --canary 10%',
    'Desplegando canary release...',
    'Salud del servicio: nominal',
    'Escalando a 100%... ok',
  ],
};

/**
 * Si un texto no existe en el idioma pedido, cae al español y luego al
 * inglés. Publicar solo en español es lo normal; la página en inglés no
 * debe quedar en blanco.
 */
export function translate(value: Json | null | undefined, locale: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object' || Array.isArray(value)) return '';

  const rec = value as Record<string, unknown>;
  for (const key of [locale, 'es', 'en']) {
    const v = rec[key];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}

export async function getHomePublication(locale: string): Promise<HomePublication | null> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('publications')
      .select('slug, title, subtitle, body, eyebrow, badge, terminal_title, terminal_lines')
      .eq('status', 'publicado')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const lines: string[] = Array.isArray(data.terminal_lines)
      ? (data.terminal_lines as Json[]).filter((l): l is string => typeof l === 'string')
      : [];

    return {
      slug: data.slug,
      title: translate(data.title, locale),
      subtitle: translate(data.subtitle, locale) || translate(data.body, locale),
      eyebrow: data.eyebrow || FALLBACK.eyebrow,
      badge: data.badge,
      terminalTitle: data.terminal_title || FALLBACK.terminalTitle,
      // Sin líneas propias se usan las de ejemplo, para que la sección
      // no se vea rota.
      terminalLines: lines.length > 0 ? lines : FALLBACK.terminalLines,
    };
  } catch {
    // Si Supabase no responde, la home sigue viéndose con el texto
    // de ejemplo. Un fallo de la base no debe dejar la tienda en blanco.
    return null;
  }
}