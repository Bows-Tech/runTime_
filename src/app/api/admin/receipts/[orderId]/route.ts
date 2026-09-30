import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Sirve el comprobante al admin: GET /api/admin/receipts/<orderId>
 *
 * Va con service role a propósito. El comprobante es un documento
 * bancario del comprador, y la tabla no tiene policies de lectura.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { orderId } = await params;
  const supabase = createAdminClient();

  const { data: receipt } = await supabase
    .from('transfer_receipts')
    .select('file_path, file_size')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!receipt) {
    return NextResponse.json({ error: 'Sin comprobante' }, { status: 404 });
  }

  const bucket = process.env.RECEIPTS_BUCKET || 'receipts';
  const { data: file, error } = await supabase.storage
    .from(bucket)
    .download(receipt.file_path);

  if (error || !file) {
    return NextResponse.json({ error: 'No se pudo leer el comprobante' }, { status: 500 });
  }

  const buffer = await file.arrayBuffer();
  const isPdf = receipt.file_path.endsWith('.pdf');

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': isPdf ? 'application/pdf' : 'image/jpeg',
      'Content-Disposition': 'inline',
      'Cache-Control': 'no-store',
    },
  });
}
