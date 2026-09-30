import { notFound } from 'next/navigation';
import { getDictionary } from '@/i18n/dictionaries';
import { isLocale, type Locale } from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';
import { ScriptForm } from '@/components/admin/script-form';
import { FileUpload } from '@/components/admin/file-upload';

export const dynamic = 'force-dynamic';

export default async function EditScriptPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'es';
  const dict = getDictionary(locale);

  const supabase = await createClient();

  const { data: script } = await supabase
    .from('scripts')
    .select('id, name, slug, extension, price_cents, category, description, file_path')
    .eq('id', id)
    .single();

  if (!script) notFound();

  const desc = (script.description ?? {}) as Record<string, string>;

  return (
    <div className="admin-page">
      <h1>{dict.admin.script.editar}</h1>
      <ScriptForm
        dict={dict}
        locale={locale}
        initial={{
          id: script.id,
          name: script.name,
          slug: script.slug,
          extension: script.extension,
          price: (script.price_cents / 100).toFixed(2),
          descriptionEs: desc.es ?? '',
          descriptionEn: desc.en ?? '',
          category: script.category,
        }}
      />

      <div className="admin-card" style={{ marginTop: 20 }}>
        <h3>
          {locale === 'es' ? 'Archivo del script' : 'Script file'}
        </h3>
        <FileUpload
          scriptId={script.id}
          currentPath={script.file_path}
          locale={locale}
          labels={
            locale === 'es'
              ? {
                  archivo: 'Archivo que se entregará al comprador',
                  subiendo: 'Subiendo',
                  subido: 'Archivo subido',
                  quitar: 'Quitar',
                  sin_archivo:
                    'Sin archivo: el script no aparecerá en el carrito ni podrá venderse.',
                  error: 'No se pudo subir el archivo',
                }
              : {
                  archivo: 'File delivered to the buyer',
                  subiendo: 'Uploading',
                  subido: 'File uploaded',
                  quitar: 'Remove',
                  sin_archivo: 'No file: the script will not be sellable.',
                  error: 'Upload failed',
                }
          }
        />
      </div>
    </div>
  );
}
