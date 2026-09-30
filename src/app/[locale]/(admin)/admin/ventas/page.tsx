import { getDictionary } from '@/i18n/dictionaries';
import { isLocale, formatPrice, type Locale } from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/lib/supabase/database.types';
import { TransferActions } from '@/components/admin/transfer-actions';

export const dynamic = 'force-dynamic';

export default async function AdminVentasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'es';
  const dict = getDictionary(locale);

  const supabase = await createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, email, amount_cents, status, payment_method, created_at, paid_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="admin-page">
      <h1>{dict.admin.ventas}</h1>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{dict.admin.tabla.orden}</th>
              <th>{dict.admin.tabla.cliente}</th>
              <th>{dict.admin.tabla.fecha}</th>
              <th>{dict.admin.pago.metodo}</th>
              <th>{dict.admin.tabla.total}</th>
              <th>{dict.admin.tabla.estado}</th>
              <th>{dict.admin.tabla.acciones}</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => (
              <tr key={order.id}>
                <td className="mono">{order.id.slice(0, 8)}</td>
                <td>{order.email}</td>
                <td>
                  {new Date(order.created_at).toLocaleDateString(
                    locale === 'es' ? 'es-MX' : 'en-US',
                  )}
                </td>
                <td>
                  {order.payment_method === 'paypal'
                    ? dict.admin.pago.paypal
                    : dict.admin.pago.transferencia}
                </td>
                <td>{formatPrice(order.amount_cents, locale)}</td>
                <td>
                  <span className={`badge badge-${order.status}`}>
                    {statusLabel(order.status, locale, dict)}
                  </span>
                </td>
                <td>
                  {order.payment_method === 'transferencia' &&
                  order.status === 'pendiente' && (
                    <TransferActions
                      orderId={order.id}
                      labels={
                        locale === 'es'
                          ? {
                              verComprobante: 'ver comprobante',
                              confirmar: 'confirmar pago',
                              rechazar: 'rechazar',
                              confirmReject: '¿Marcar esta transferencia como rechazada?',
                            }
                          : {
                              verComprobante: 'view receipt',
                              confirmar: 'confirm payment',
                              rechazar: 'reject',
                              confirmReject: 'Mark this transfer as rejected?',
                            }
                      }
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(orders ?? []).length === 0 && <p className="cart-empty">{dict.admin.tabla.vacio}</p>}
      </div>
    </div>
  );
}

function statusLabel(status: OrderStatus, locale: Locale, dict: ReturnType<typeof getDictionary>) {
  const labels = {
    pagado: dict.admin.estados.pagado,
    pendiente: dict.admin.estados.pendiente,
    fallido: dict.admin.estados.fallido,
    reembolsado: dict.admin.estados.reembolsado,
  };
  return labels[status] ?? status;
}
