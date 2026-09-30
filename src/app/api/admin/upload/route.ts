import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Sube el archivo de un script al bucket PRIVADO de Supabase Storage.
 *
 * El archivo NO se guarda en el servidor Next.js ni se sirve desde ahí:
 * se sube directamente a Storage y aquí solo devolvemos la ruta para que
 * el admin la guarde en scripts.file_path.
 *
 * POST multipart/form-data:
 *   scriptId: id del script al que pertenece el archivo
 *   file:     el binario
 */

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

// Solo formatos que realmente vendemos. Un bucket de scripts no debería
// poder almacenar .php, .html ni ejecutables.
const ALLOWED_EXTENSIONS = new Set([
  'py',
  'sh',
  'js',
  'ts',
  'rb',
  'pl',
  'go',
  'ps1',
  'bash',
  'zsh',
  'sql',
  'md',
  'txt',
  'zip',
  'tar',
  'gz',
]);

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el archivo' }, { status: 400 });
  }

  const scriptId = formData.get('scriptId');
  const file = formData.get('file');

  if (typeof scriptId !== 'string' || !scriptId) {
    return NextResponse.json({ error: 'Falta scriptId' }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `El archivo supera los ${Math.floor(MAX_BYTES / 1024 / 1024)} MB` },
      { status: 413 },
    );
  }

  const extension = (file.name.split('.').pop() ?? '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { error: `Extensión no permitida: .${extension || 'sin extensión'}` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const bucket = process.env.SCRIPTS_BUCKET || 'scripts';

  // Verificamos que el script existe antes de subir nada, para no dejar
  // archivos huérfanos en el bucket si el id viene mal.
  const { data: script } = await supabase
    .from('scripts')
    .select('id, slug')
    .eq('id', scriptId)
    .single();

  if (!script) {
    return NextResponse.json({ error: 'El script no existe' }, { status: 404 });
  }

  // La ruta usa el slug, no el nombre original que envió el usuario:
  // evita ../ y caracteres raros en la clave del objeto.
  const path = `${script.slug}/${Date.now()}-${sanitize(script.slug)}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: 'application/octet-stream',
      // Sobrescribe si se sube una versión nueva del mismo script.
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Guardamos ruta, tamaño y extensión. La extensión se sincroniza con
  // la del archivo subido porque la descarga la usa para nombrar el
  // fichero: sin esto, un .js subido a un script marcado como 'py'
  // se descargaría con extensión .py y con contenido JavaScript.
  await supabase
    .from('scripts')
    .update({
      file_path: path,
      file_size: file.size,
      extension,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scriptId);

  return NextResponse.json({ filePath: path, size: file.size });
}

function sanitize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .slice(0, 60);
}
