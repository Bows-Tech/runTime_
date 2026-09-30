import { getDictionary } from '@/i18n/dictionaries';
import { isLocale, formatPrice, type Locale } from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';
import { pickTranslation } from '@/lib/supabase/database.types';
import { ScriptForm } from '@/components/admin/script-form';
import { StatusSelect } from '@/components/admin/status-select';
import { DeleteScriptButton } from '@/components/admin/delete-script-button';

export const dynamic = 'force-dynamic';

export default async function AdminScriptsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { locale: raw } = await params;
  const { nuevo } = await searchParams;
  const locale: Locale = isLocale(raw) ? raw : 'es';
  const dict = getDictionary(locale);

  const supabase = await createClient();

  const { data: scripts } = await supabase
    .from('scripts')
    .select(
      'id, slug, name, extension, price_cents, status, sales_count, download_count, description, file_path, category',
    )
    .order('created_at', { ascending: false });

  // Las categorías son las que ya usa algún script. Así el desplegable
  // ofrece lo que existe de verdad en vez de una lista fija en el
  // código que se desincroniza.
  const categories = [
    ...new Set((scripts ?? []).map((s) => s.category).filter(Boolean)),
  ] as string[];
  categories.sort((a, b) => a.localeCompare(b));

  const mostrarForm = nuevo === '1';

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>{dict.admin.scripts}</h1>
        {/* El botón se oculta mientras el formulario está abierto: si no,
            queda el botón "Nuevo" encima del formulario. El enlace vacío
            (`?`) es lo que lo cierra. */}
        {!mostrarForm && (
          <a href="?nuevo=1" className="btn-admin btn-admin--primary">
            {dict.admin.script.crear}
          </a>
        )}
      </div>

      {mostrarForm && (
        <ScriptForm dict={dict} locale={locale} categories={categories} />
      )}

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{dict.admin.script.nombre}</th>
              <th>{dict.admin.script.precio}</th>
              <th>{dict.admin.script.estado}</th>
              <th>{dict.admin.script.downloads}</th>
              <th>{dict.admin.tabla.acciones}</th>
            </tr>
          </thead>
          <tbody>
            {(scripts ?? []).map((script) => (
              <tr key={script.id}>
                <td>
                  <strong>{script.name}</strong>
                  <span className="mono" style={{ opacity: 0.5 }}>
                    {' '}
                    .{script.extension} · /{script.slug}
                  </span>
                  <br />
                  <small style={{ opacity: 0.6 }}>
                    {pickTranslation(script.description, locale, '—')}
                  </small>
                  <br />
                  {script.file_path ? (
                    <span className="file-badge">
                      {locale === 'es' ? 'archivo listo' : 'file ready'}
                    </span>
                  ) : (
                    <span className="file-badge missing">
                      {locale === 'es' ? 'sin archivo — no se podrá vender' : 'no file — not sellable'}
                    </span>
                  )}
                </td>
                <td>{formatPrice(script.price_cents, locale)}</td>
                <td>
                  <StatusSelect
                    id={script.id}
                    value={script.status}
                    labels={{
                      borrador: dict.admin.estados.borrador,
                      publicado: dict.admin.estados.publicado,
                      archivado: dict.admin.estados.archivado,
                    }}
                  />
                </td>
                <td>
                  {script.sales_count} / {script.download_count}
                </td>
                <td>
                  <div className="admin-row-actions">
                    <a
                      className="btn-admin btn-admin--sm"
                      href={`/${locale}/admin/scripts/${script.id}`}
                    >
                      {dict.admin.script.editar}
                    </a>
                    <DeleteScriptButton
                      id={script.id}
                      labels={{
                        eliminar: dict.admin.script.eliminar,
                        confirmar: dict.admin.script.confirmar_eliminar,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(scripts ?? []).length === 0 && <p className="cart-empty">{dict.admin.tabla.vacio}</p>}
      </div>
    </div>
  );
}
