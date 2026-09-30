import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { markOrderPaidAndIssueTokens } from '@/lib/orders';

export const dynamic = 'force-dynamic';

/**
 * El admin confirma que la transferencia llegó.
 *
 * PATCH /api/admin/orders/<id>  { action: 'confirm' | 'reject' }
 *
 * 'confirm' reutiliza markOrderPaidAndIssueTokens, que es idempotente:
 * si la orden ya estaba pagada no vuelve a emitir tokens.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action !== 'confirm' && action !== 'reject') {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Solo las transferencias pendientes se confirman a mano.
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, payment_method')
    .eq('id', id)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  }
  if (order.payment_method !== 'transferencia') {
    return NextResponse.json(
      { error: 'Esta orden no es de transferencia' },
      { status: 400 },
    );
  }
  if (order.status !== 'pendiente') {
    return NextResponse.json(
      { error: `La orden ya está en estado "${order.status}"` },
      { status: 409 },
    );
  }

  // No se confirma sin comprobante adjunto.
  const { data: receipt } = await supabase
    .from('transfer_receipts')
    .select('id')
    .eq('order_id', id)
    .limit(1)
    .maybeSingle();

  if (!receipt) {
    return NextResponse.json(
      { error: 'No hay comprobante adjunto' },
      { status: 400 },
    );
  }

  if (action === 'reject') {
    await supabase.from('orders').update({ status: 'fallido' }).eq('id', id);
    return NextResponse.json({ ok: true, status: 'fallido' });
  }

  // confirm → marca pagado y emite los tokens de descarga
  const changed = await markOrderPaidAndIssueTokens(id, { payment_method: 'transferencia' });
  await supabase.from('transfer_receipts').update({ reviewed: true }).eq('order_id', id);

  return NextResponse.json({ ok: true, changed, status: 'pagado' });
}
