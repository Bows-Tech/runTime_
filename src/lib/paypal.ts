/**
 * Cliente de la API REST de PayPal.
 *
 * Uso fetch directo contra la API en vez de un SDK para no agregar otra
 * dependencia: son cuatro endpoints (auth, crear, capturar, consultar).
 * Si más adelante necesitas webhooks firmados o más operaciones, cambia
 * esto por `@paypal/paypal-server-sdk`.
 */

const API_BASE =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

export type PayPalOrder = {
  id: string;
  status: string;
  links?: { rel: string; href: string }[];
};

async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  if (!clientId || !secret) {
    throw new Error('Faltan NEXT_PUBLIC_PAYPAL_CLIENT_ID o PAYPAL_SECRET');
  }

  const basic = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`PayPal auth falló (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

async function paypalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`PayPal ${path} falló (${res.status}): ${await res.text()}`);
  }

  return (await res.json()) as T;
}

export function createPayPalOrder(
  amountCents: number,
  description: string,
  returnUrl: string,
  cancelUrl: string,
  referenceId: string,
): Promise<PayPalOrder> {
  const value = (amountCents / 100).toFixed(2);

  return paypalFetch<PayPalOrder>('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: referenceId,
          description: description.slice(0, 127),
          amount: { currency_code: 'USD', value },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            user_action: 'PAY_NOW',
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        },
      },
    }),
  });
}

/** Confirma el cobro de una orden aprobada por el usuario. */
export function capturePayPalOrder(orderId: string): Promise<PayPalOrder> {
  return paypalFetch<PayPalOrder>(`/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    body: '{}',
  });
}

export function getPayPalOrder(orderId: string): Promise<PayPalOrder> {
  return paypalFetch<PayPalOrder>(`/v2/checkout/orders/${orderId}`);
}

/** Extrae el enlace de aprobación que hay que enviarle al navegador. */
export function approvalUrl(order: PayPalOrder): string | null {
  const link = order.links?.find((l) => l.rel === 'payer-action' || l.rel === 'approve');
  return link?.href ?? null;
}
