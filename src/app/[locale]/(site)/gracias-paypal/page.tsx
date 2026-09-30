import type { Locale } from '@/i18n/config';
import { PaypalReturn } from '@/components/paypal-return';

export default async function GraciasPaypalPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ order_id?: string; token?: string }>;
}) {
  const { locale } = await params;
  const { order_id } = await searchParams;
  const es = locale === 'es';

  const labels = es
    ? {
        loading: 'Confirmando tu pago con PayPal…',
        ok: '✓ Pago confirmado. Redirigiendo a tus descargas…',
        error: 'No pudimos confirmar el pago. Escríbenos si ya te cobraron.',
      }
    : {
        loading: 'Confirming your PayPal payment…',
        ok: '✓ Payment confirmed. Redirecting to your downloads…',
        error: "We couldn't confirm the payment. Contact us if you were charged.",
      };

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 620 }}>
        <p className="eyebrow">PayPal</p>
        <h1>{es ? 'Pago con PayPal' : 'PayPal payment'}</h1>
        {order_id ? (
          <PaypalReturn orderId={order_id} locale={locale} labels={labels} />
        ) : (
          <p className="form-error">{labels.error}</p>
        )}
      </div>
    </section>
  );
}
