import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ orderId: string }> };

/**
 * Estado de una orden de transferencia + enlaces de descarga si ya fue
 * confirmada.
 *
 * El orderId (UUID v4) actúa como credencial: solo quien lo tiene llega
 * a esta ruta, porque se lo mostramos al comprador en la URL de su
 * página. No es adivinable. Los tokens de descarga siguen siendo de un
 * solo uso, así que esta ruta no debilita nada.
 *
 * /descargas (por email) queda como vía de respaldo para cuando el
 * cliente pierde la URL.
 */
export async function GET(_request: Request, { params }: Params) {
  const { orderId } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    return NextResponse.json({ error: 'Orden no válida' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from('orders')
    .select('id, amount_cents, status, payment_method, created_at')
    .eq('id', orderId)
    .eq('payment_method', 'transferencia')
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  }

  // Los enlaces solo existen cuando el pago está confirmado. Antes de eso
  // no hay nada que devolver.
  if (order.status !== 'pagado') {
    return NextResponse.json({ status: order.status, downloads: [] });
  }

  const { data: tokens } = await supabase
    .from('download_tokens')
    .select('token, used, expires_at, scripts (name, extension)')
    .eq('order_id', orderId);

  const downloads = (tokens ?? []).map((t) => ({
    token: t.token,
    used: t.used,
    expiresAt: t.expires_at,
    name: (t.scripts as { name?: string } | null)?.name ?? '',
    extension: (t.scripts as { extension?: string } | null)?.extension ?? '',
  }));

  return NextResponse.json({ status: order.status, downloads });
}
