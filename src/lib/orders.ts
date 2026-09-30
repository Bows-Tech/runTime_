import { createAdminClient } from './supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Marca la orden como pagada y emite un token de descarga por cada script
 * comprado (válido 7 días).
 *
 * La usan el retorno de PayPal y la confirmación manual de transferencias,
 * así que vive aquí para que ambos caminos hagan exactamente lo mismo.
 *
 * Idempotente: si se llama dos veces para la misma orden, el segundo
 * `update` filtrando por status='pendiente' no afecta ninguna fila, y la
 * función retorna sin emitir tokens duplicados.
 */
export async function markOrderPaidAndIssueTokens(
  orderId: string,
  patch: Record<string, unknown> = {},
) {
  const supabase = createAdminClient();

  const { data: updated, error } = await supabase
    .from('orders')
    .update({
      status: 'pagado',
      paid_at: new Date().toISOString(),
      ...patch,
    })
    .eq('id', orderId)
    .eq('status', 'pendiente')
    .select('id');

  if (error) throw error;
  if (!updated || updated.length === 0) return false; // ya procesada

  await issueDownloadTokens(supabase, orderId);
  return true;
}

/** Crea un token de descarga por cada script comprado. */
export async function issueDownloadTokens(supabase: AdminClient, orderId: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('email')
    .eq('id', orderId)
    .single();

  if (!order) return;

  const { data: items } = await supabase
    .from('order_items')
    .select('script_id')
    .eq('order_id', orderId);

  if (!items?.length) return;

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const rows = items
    .filter((item) => item.script_id)
    .map((item) => ({
      order_id: orderId,
      script_id: item.script_id as string,
      email: order.email,
      expires_at: expiresAt,
    }));

  if (rows.length === 0) return;

  const { error } = await supabase.from('download_tokens').insert(rows);
  if (error) {
    console.error('[orders] no se pudieron crear los tokens:', error.message);
    return;
  }

  for (const row of rows) {
    const { error: rpcError } = await supabase.rpc('increment_sales_count', {
      p_script_id: row.script_id,
    });
    // Si la función no existe, el contador no sube; no es fatal.
    if (rpcError) console.warn('[orders] increment_sales_count:', rpcError.message);
  }
}
