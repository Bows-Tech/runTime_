import { getDictionary } from '@/i18n/dictionaries';
import { isLocale, formatPrice, type Locale } from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminClientesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'es';
  const dict = getDictionary(locale);

  const supabase = await createClient();

  // Agrupamos por email en memoria: suficiente para el volumen de una
  // tienda de scripts. Si crece mucho, mueve esto a una vista de Postgres.
  const [{ data: orders }, { data: subs }] = await Promise.all([
    supabase
      .from('orders')
      .select('email, amount_cents, status, created_at, payment_method')
      .order('created_at', { ascending: false }),
    supabase.from('subscribers').select('email, created_at'),
  ]);

  type Row = { email: string; spent: number; orders: number; last: string; methods: Set<string> };

  const byEmail = new Map<string, Row>();

  for (const order of orders ?? []) {
    const row = byEmail.get(order.email) ?? {
      email: order.email,
      spent: 0,
      orders: 0,
      last: order.created_at,
      methods: new Set<string>(),
    };
    if (order.status === 'pagado') {
      row.spent += order.amount_cents;
      row.orders += 1;
    }
    if (order.payment_method) row.methods.add(order.payment_method);
    if (order.created_at > row.last) row.last = order.created_at;
    byEmail.set(order.email, row);
  }

  const customers = [...byEmail.values()].sort((a, b) => b.spent - a.spent);
  const subscriberEmails = new Set((subs ?? []).map((s) => s.email));

  return (
    <div className="admin-page">
      <h1>{dict.admin.clientes}</h1>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{dict.admin.tabla.cliente}</th>
              <th>{dict.admin.metricas.pedidos}</th>
              <th>{dict.admin.metricas.ingresos}</th>
              <th>{dict.admin.pago.metodo}</th>
              <th>{dict.admin.tabla.fecha}</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.email}>
                <td>
                  {c.email}
                  {subscriberEmails.has(c.email) && (
                    <span className="badge badge-borrador" style={{ marginLeft: 8 }}>
                      {locale === 'es' ? 'suscriptor' : 'subscriber'}
                    </span>
                  )}
                </td>
                <td>{c.orders}</td>
                <td>{formatPrice(c.spent, locale)}</td>
                <td>{[...c.methods].join(', ') || '—'}</td>
                <td>{new Date(c.last).toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {customers.length === 0 && <p className="cart-empty">{dict.admin.tabla.vacio}</p>}
      </div>
    </div>
  );
}
