import { getDictionary } from '@/i18n/dictionaries';
import { isLocale, type Locale } from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';
import { pickTranslation } from '@/lib/supabase/database.types';
import { PublicationForm } from '@/components/admin/publication-form';
import { StatusSelect } from '@/components/admin/status-select';

export const dynamic = 'force-dynamic';

export default async function AdminPublicacionesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ nueva?: string }>;
}) {
  const { locale: raw } = await params;
  const { nueva } = await searchParams;
  const locale: Locale = isLocale(raw) ? raw : 'es';
  const dict = getDictionary(locale);

  const supabase = await createClient();

  const { data: publications } = await supabase
    .from('publications')
    .select('id, slug, title, status, published_at, updated_at')
    .order('updated_at', { ascending: false });

  const mostrarForm = nueva === '1';

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>{dict.admin.publicaciones}</h1>
        {/* Igual que en scripts: el botón desaparece con el formulario. */}
        {!mostrarForm && (
          <a href="?nueva=1" className="btn-admin btn-admin--primary">
            {dict.admin.publicacion.crear}
          </a>
        )}
      </div>

      {mostrarForm && <PublicationForm dict={dict} locale={locale} />}

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{dict.admin.publicacion.titulo}</th>
              <th>{dict.admin.script.slug}</th>
              <th>{dict.admin.publicacion.fecha}</th>
              <th>{dict.admin.script.estado}</th>
            </tr>
          </thead>
          <tbody>
            {(publications ?? []).map((pub) => (
              <tr key={pub.id}>
                <td>{pickTranslation(pub.title, locale, '—')}</td>
                <td className="mono">/{pub.slug}</td>
                <td>
                  {pub.published_at
                    ? new Date(pub.published_at).toLocaleDateString(
                        locale === 'es' ? 'es-MX' : 'en-US',
                      )
                    : '—'}
                </td>
                <td>
                  <StatusSelect
                    id={pub.id}
                    value={pub.status}
                    endpoint="/api/admin/publications"
                    labels={{
                      borrador: dict.admin.estados.borrador,
                      publicado: dict.admin.estados.publicado,
                      archivado: dict.admin.estados.archivado,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(publications ?? []).length === 0 && (
          <p className="cart-empty">{dict.admin.tabla.vacio}</p>
        )}
      </div>
    </div>
  );
}
