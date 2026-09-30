import { NextResponse } from 'next/server';
import { createPayPalOrder, approvalUrl } from '@/lib/paypal';
import { getSiteUrl } from '@/lib/site';
import { createAdminClient } from '@/lib/supabase/admin';

type Body = {
  email?: string;
  locale?: string;
  items?: { id: string }[];
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  const requested = body.items ?? [];
  if (requested.length === 0 || requested.length > 50) {
    return NextResponse.json({ error: 'Carrito inválido' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // El precio sale de la base, nunca del cliente.
  const { data: scripts, error: scriptsError } = await supabase
    .from('scripts')
    .select('id, name, price_cents, file_path')
    .in('id', requested.map((i) => i.id))
    .eq('status', 'publicado');

  if (scriptsError) {
    return NextResponse.json({ error: scriptsError.message }, { status: 500 });
  }
  if (!scripts || scripts.length !== requested.length) {
    return NextResponse.json({ error: 'Scripts no disponibles' }, { status: 400 });
  }

  const sellable = scripts.filter((s) => s.file_path);
  if (sellable.length === 0) {
    return NextResponse.json(
      { error: 'Ese script todavía no está disponible para descarga' },
      { status: 400 },
    );
  }

  const amountCents = sellable.reduce((sum, s) => sum + s.price_cents, 0);
  const locale = body.locale === 'en' ? 'en' : 'es';
  const siteUrl = getSiteUrl();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      email,
      amount_cents: amountCents,
      currency: 'usd',
      status: 'pendiente',
      payment_method: 'paypal',
    })
    .select('id')
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? 'Error' }, { status: 500 });
  }

  const { error: itemsError } = await supabase.from('order_items').insert(
    sellable.map((s) => ({
      order_id: order.id,
      script_id: s.id,
      script_name: s.name,
      unit_cents: s.price_cents,
      quantity: 1,
    })),
  );

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  try {
    const ppOrder = await createPayPalOrder(
      amountCents,
      `runtime_ (${sellable.length} scripts)`,
      `${siteUrl}/${locale}/gracias-paypal?order_id=${order.id}`,
      `${siteUrl}/${locale}#shop`,
      order.id,
    );

    await supabase
      .from('orders')
      .update({ paypal_order_id: ppOrder.id })
      .eq('id', order.id);

    const href = approvalUrl(ppOrder);
    if (!href) throw new Error('PayPal no devolvió enlace de aprobación');

    return NextResponse.json({ approveUrl: href, orderId: order.id });
  } catch (err) {
    await supabase.from('orders').update({ status: 'fallido' }).eq('id', order.id);
    const message = err instanceof Error ? err.message : 'Error al crear la orden PayPal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
