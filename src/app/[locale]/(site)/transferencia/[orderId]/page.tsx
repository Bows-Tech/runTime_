import { notFound } from 'next/navigation';
import { isLocale, formatPrice, type Locale } from '@/i18n/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBankInfo, isBankInfoConfigured } from '@/lib/bank';
import { TransferStatus } from '@/components/transfer-status';

export const dynamic = 'force-dynamic';

/**
 * Instrucciones de pago tras enviar el comprobante.
 *
 * Muestra los datos bancarios, el monto exacto y el estado del pedido.
 * El orden importa: el buyer paga, nosotros confirmamos a mano.
 */
export default async function TransferenciaPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale: raw, orderId } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'es';
  const es = locale === 'es';

  // Service role, a propósito: el comprador NO tiene sesión (nadie se
  // registra para comprar), y las policies de `orders` solo dejan leer
  // al comprador autenticado o a un admin. Con el cliente normal esta
  // consulta devolvía 0 filas y la página daba 404 siempre.
  //
  // El orderId es un UUID v4 no adivinable que solo tiene quien compró,
  // porque va en su URL. Por eso el service role aquí no expone nada
  // nuevo: quien no tenga el UUID no llega a esta ruta.
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from('orders')
    .select('id, email, amount_cents, status, payment_method, created_at')
    .eq('id', orderId)
    .eq('payment_method', 'transferencia')
    .single();

  if (!order) notFound();

  const bank = getBankInfo();
  const configured = isBankInfoConfigured(bank);

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 680 }}>
        <p className="eyebrow">✓</p>
        <h1>{es ? 'Transferencia registrada' : 'Transfer registered'}</h1>

        <p>
          {es
            ? 'Recibimos tu comprobante. Revisa que el monto sea exacto y transfiere con los datos de abajo.'
            : 'We received your receipt. Make sure the amount is exact and transfer using the details below.'}
        </p>

        {!configured && (
          <p className="form-error">
            {es
              ? 'AVISO: los datos bancarios no están configurados. El administrador debe definir BANK_ACCOUNT_NUMBER y BANK_ACCOUNT_HOLDER en .env.local.'
              : 'WARNING: bank details are not configured. The admin must set BANK_ACCOUNT_NUMBER and BANK_ACCOUNT_HOLDER in .env.local.'}
          </p>
        )}

        <div className="bank-box">
          <div>
            <span>{es ? 'Banco' : 'Bank'}</span>
            <strong>{bank.banco}</strong>
          </div>
          <div>
            <span>{es ? 'Tipo de cuenta' : 'Account type'}</span>
            <strong>{bank.tipoCuenta}</strong>
          </div>
          <div>
            <span>{es ? 'Número' : 'Number'}</span>
            <strong className="mono">{bank.numero}</strong>
          </div>
          <div>
            <span>{es ? 'Titular' : 'Holder'}</span>
            <strong>{bank.titular}</strong>
          </div>
          <div>
            <span>{es ? 'Monto exacto' : 'Exact amount'}</span>
            <strong className="mono">{formatPrice(order.amount_cents, locale)}</strong>
          </div>
        </div>

        <p className="upload-hint" style={{ marginTop: 16 }}>
          {es
            ? `Cuando hagas la transferencia, escribe esta referencia en el concepto: ${order.id.slice(0, 8).toUpperCase()}`
            : `When you make the transfer, put this reference in the description: ${order.id.slice(0, 8).toUpperCase()}`}
        </p>

        <div style={{ marginTop: 32 }}>
          <TransferStatus
            orderId={order.id}
            locale={locale}
            amountCents={order.amount_cents}
            labels={
              es
                ? {
                    esperando: 'Esperando tu transferencia…',
                    ya_pagado: '✓ Pago confirmado',
                    descargar: 'descargar',
                    expira: 'Vence el',
                    sin_conexion: 'Sin conexión. Revisando de nuevo…',
                    rechazada: 'Esta orden fue rechazada o cancelada.',
                    perdidos:
                      'Los enlaces son de un solo uso. Si necesitas los scripts otra vez, escríbenos y te los reenviamos.',
                    otra_orden: 'Ver otra orden',
                  }
                : {
                    esperando: 'Waiting for your transfer…',
                    ya_pagado: '✓ Payment confirmed',
                    descargar: 'download',
                    expira: 'Expires on',
                    sin_conexion: 'No connection. Retrying…',
                    rechazada: 'This order was rejected or cancelled.',
                    perdidos:
                      'Links are single use. If you need the scripts again, contact us and we will resend them.',
                    otra_orden: 'View another order',
                  }
            }
          />
        </div>

        {bank.whatsapp && (
          <p style={{ marginTop: 24 }}>
            <span className="mono">{bank.whatsapp}</span>
          </p>
        )}
      </div>
    </section>
  );
}
