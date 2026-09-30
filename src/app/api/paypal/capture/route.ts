import { NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { createAdminClient } from '@/lib/supabase/admin';
import { markOrderPaidAndIssueTokens } from '@/lib/orders';

type Body = { orderId?: string };

/**
 * Se llama desde la página de gracias de PayPal, después de que el
 * usuario aprobó el pago en la ventana de PayPal.
 *
 * Marcar la orden aquí es seguro porque verificamos con PayPal que la
 * orden realmente quedó en estado COMPLETED antes de tocar nuestra base.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const orderId = body.orderId;
  if (!orderId) {
    return NextResponse.json({ error: 'Falta orderId' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, paypal_order_id, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  }

  // Si ya está pagada no hay nada que hacer (el usuario refrescó la página).
  if (order.status === 'pagado') {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  const ppOrderId = order.paypal_order_id;
  if (!ppOrderId) {
    return NextResponse.json({ error: 'Orden sin referencia de PayPal' }, { status: 400 });
  }

  let capture;
  try {
    capture = await capturePayPalOrder(ppOrderId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al capturar';
    await supabase.from('orders').update({ status: 'fallido' }).eq('id', orderId);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (capture.status !== 'COMPLETED') {
    return NextResponse.json(
      { error: `El pago no se completó (estado: ${capture.status})` },
      { status: 400 },
    );
  }

  await markOrderPaidAndIssueTokens(orderId);

  return NextResponse.json({ ok: true });
}
