import { NextResponse, after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSiteUrl } from '@/lib/site';
import { notifyNewReceipt } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

type Body = {
  email?: string;
  locale?: string;
  items?: { id: string }[];
  receipt?: File;
  note?: string;
};

/**
 * Cobro por transferencia bancaria.
 *
 * El flujo en Ecuador es: el comprador genera la orden, transfiere por
 * cualquier canal, y sube el comprobante. La orden nace en 'pendiente'
 * y NO se emiten tokens todavía. Cuando el admin la confirma desde
 * /admin/ventas, se llama a markOrderPaidAndIssueTokens.
 *
 * No hay webhook: la confirmación es humana a propósito. Es la única
 * forma fiable de saber que el dinero llegó de verdad.
 */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el formulario' }, { status: 400 });
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const locale = formData.get('locale') === 'en' ? 'en' : 'es';
  const receipt = formData.get('receipt');
  const note = String(formData.get('note') ?? '').slice(0, 500);

  if (!email || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  // Los ids llegan como JSON en un campo del formulario. Solo se acepta
  // un array de UUID en texto: el cliente manda únicamente ids y el
  // servidor deduce el resto de la base de datos. Aceptar objetos
  // (por ejemplo {id, priceCents}) obligaría a confiar en lo que llegue.
  let ids: unknown;
  try {
    ids = JSON.parse(String(formData.get('items') ?? '[]'));
  } catch {
    return NextResponse.json({ error: 'Carrito inválido' }, { status: 400 });
  }

  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50) {
    return NextResponse.json({ error: 'Carrito inválido' }, { status: 400 });
  }

  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!ids.every((id) => typeof id === 'string' && UUID.test(id))) {
    return NextResponse.json({ error: 'Carrito inválido' }, { status: 400 });
  }
  const scriptIds = ids as string[];

  if (!(receipt instanceof File) || receipt.size === 0) {
    return NextResponse.json(
      { error: 'Adjunta el comprobante de la transferencia' },
      { status: 400 },
    );
  }
  if (receipt.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'El comprobante supera los 10 MB' },
      { status: 413 },
    );
  }
  if (!ALLOWED_TYPES.has(receipt.type)) {
    return NextResponse.json(
      { error: 'El comprobante debe ser una imagen o un PDF' },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Precios desde la base, nunca desde el cliente.
  const { data: scripts, error: scriptsError } = await supabase
    .from('scripts')
    .select('id, name, price_cents, file_path')
    .in('id', scriptIds)
    .eq('status', 'publicado');

  if (scriptsError) {
    return NextResponse.json({ error: scriptsError.message }, { status: 500 });
  }
  if (!scripts || scripts.length !== scriptIds.length) {
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

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      email,
      amount_cents: amountCents,
      currency: 'usd',
      status: 'pendiente',
      payment_method: 'transferencia',
    })
    .select('id, created_at')
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message ?? 'No pudimos registrar la orden' },
      { status: 500 },
    );
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
    await supabase.from('orders').update({ status: 'fallido' }).eq('id', order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // El comprobante va a un bucket privado aparte del de los scripts:
  // son documentos personales del comprador, no productos.
  const bucket = process.env.RECEIPTS_BUCKET || 'receipts';
  const extension = guessExtension(receipt.type);
  const path = `${order.id}/${Date.now()}.${extension}`;
  const buffer = Buffer.from(await receipt.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: receipt.type, upsert: true });

  if (uploadError) {
    await supabase.from('orders').update({ status: 'fallido' }).eq('id', order.id);
    return NextResponse.json(
      { error: 'No pudimos guardar el comprobante' },
      { status: 500 },
    );
  }

  const { error: receiptError } = await supabase.from('transfer_receipts').insert({
    order_id: order.id,
    file_path: path,
    file_size: receipt.size,
    note: note || null,
  });

  if (receiptError) {
    await supabase.from('orders').update({ status: 'fallido' }).eq('id', order.id);
    return NextResponse.json({ error: receiptError.message }, { status: 500 });
  }

  // Aviso al admin, ahora que la orden y el comprobante ya existen.
  // `after` corre una vez enviada la respuesta: el comprador no espera a
  // Telegram, y si el aviso falla la venta sigue siendo válida.
  after(() =>
    notifyNewReceipt({
      orderId: order.id,
      email,
      amountCents,
      scripts: sellable.map((s) => s.name),
      siteUrl: getSiteUrl(),
    }).catch(() => false),
  );

  return NextResponse.json({ orderId: order.id, amountCents, locale });
}

function guessExtension(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'jpg';
  }
}
