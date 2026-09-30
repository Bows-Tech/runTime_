import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Descarga protegida: /api/download/<token>
 *
 * El token se genera tras el pago y caduca a los 7 días. Aquí se valida
 * que exista, no se haya usado y no haya expirado, y solo entonces se
 * sirve el archivo desde el bucket PRIVADO de Supabase.
 *
 * Nunca se expone file_path al navegador: por eso el archivo se pide
 * al storage con la service role y se devuelve por streaming.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: record } = await supabase
    .from('download_tokens')
    .select('token, script_id, used, expires_at')
    .eq('token', token)
    .single();

  if (!record) {
    return NextResponse.json({ error: 'Token no encontrado' }, { status: 404 });
  }
  if (record.used) {
    return NextResponse.json({ error: 'Este enlace ya fue utilizado' }, { status: 410 });
  }
  if (new Date(record.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Este enlace expiró' }, { status: 410 });
  }

  const { data: script } = await supabase
    .from('scripts')
    .select('name, extension, file_path')
    .eq('id', record.script_id)
    .single();

  if (!script?.file_path) {
    return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 });
  }

  // Descargamos del bucket privado.
  const bucket = process.env.SCRIPTS_BUCKET || 'scripts';
  const { data: file, error: dlError } = await supabase.storage
    .from(bucket)
    .download(script.file_path);

  if (dlError || !file) {
    return NextResponse.json({ error: 'No se pudo leer el archivo' }, { status: 500 });
  }

  // Marcamos el token como usado ANTES de entregarlo. Si el cliente
  // cancela a mitad de la descarga, pierde el enlace y hay que pedirle
  // otro: es preferible a regalar enlaces ilimitados.
  await supabase.from('download_tokens').update({ used: true }).eq('token', token);

  await supabase.rpc('increment_download_count', { p_script_id: record.script_id });

  const buffer = await file.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${script.name}.${script.extension}"`,
      'Cache-Control': 'no-store',
    },
  });
}
