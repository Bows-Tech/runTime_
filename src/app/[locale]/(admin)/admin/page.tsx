import { getDictionary } from '@/i18n/dictionaries';
import { isLocale, formatPrice, type Locale } from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';
import { TelegramTestButton } from '@/components/admin/telegram-test-button';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'es';
  const dict = getDictionary(locale);

  const supabase = await createClient();

  // Métricas: revenue real (solo órdenes pagadas), conteo y ticket promedio.
  const [{ data: orders }, { data: scripts }, { data: subs }] = await Promise.all([
    supabase
      .from('orders')
      .select('amount_cents, status, payment_method')
      .eq('status', 'pagado'),
    supabase.from('scripts').select('id, status, sales_count'),
    supabase.from('subscribers').select('id'),
  ]);

  const paid = orders ?? [];
  const revenue = paid.reduce((sum, o) => sum + o.amount_cents, 0);
  const ticket = paid.length ? Math.round(revenue / paid.length) : 0;

  const publishedScripts = (scripts ?? []).filter((s) => s.status === 'publicado').length;
  const totalSales = (scripts ?? []).reduce((sum, s) => sum + (s.sales_count ?? 0), 0);

  const byMethod = {
    transferencia: paid.filter((o) => o.payment_method === 'transferencia').length,
    paypal: paid.filter((o) => o.payment_method === 'paypal').length,
  };

  const metrics = [
    { label: dict.admin.metricas.ingresos, value: formatPrice(revenue, locale) },
    { label: dict.admin.metricas.pedidos, value: String(paid.length) },
    { label: dict.admin.metricas.ticket, value: formatPrice(ticket, locale) },
    { label: dict.admin.scripts, value: `${publishedScripts}` },
  ];

  return (
    <div className="admin-page">
      <h1>{dict.admin.dashboard}</h1>

      <div className="admin-metrics">
        {metrics.map((m) => (
          <div className="admin-metric" key={m.label}>
            <span>{m.label}</span>
            <strong>{m.value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <h3>{locale === 'es' ? 'Resumen' : 'Summary'}</h3>
        <dl className="admin-stats">
          <div>
            <dt>{dict.admin.metricas.ingresos} · {dict.admin.pago.transferencia}</dt>
            <dd>{byMethod.transferencia}</dd>
          </div>
          <div>
            <dt>{dict.admin.metricas.ingresos} · {dict.admin.pago.paypal}</dt>
            <dd>{byMethod.paypal}</dd>
          </div>
          <div>
            <dt>{locale === 'es' ? 'Ventas de scripts' : 'Script sales'}</dt>
            <dd>{totalSales}</dd>
          </div>
          <div>
            <dt>{locale === 'es' ? 'Suscriptores' : 'Subscribers'}</dt>
            <dd>{subs?.length ?? 0}</dd>
          </div>
        </dl>
      </div>

      <div className="admin-card">
        <h3>{locale === 'es' ? 'Avisos de venta' : 'Sale alerts'}</h3>
        <p className="telegram-test__hint">
          {locale === 'es'
            ? 'Te aviso por Telegram cuando un comprador sube el comprobante, que es lo que necesita tu confirmación.'
            : 'I notify you on Telegram when a buyer uploads the receipt, since that is what needs your confirmation.'}
        </p>
        <TelegramTestButton
          labels={{
            telegramProbar: locale === 'es' ? 'Probar aviso' : 'Test alert',
            telegramEnviado: locale === 'es' ? 'Aviso enviado' : 'Alert sent',
            telegramFallo: locale === 'es' ? 'No se pudo enviar' : 'Could not send',
          }}
        />
      </div>
    </div>
  );
}
