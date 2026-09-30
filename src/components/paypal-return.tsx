'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  orderId: string;
  locale: string;
  labels: Record<string, string>;
};

/**
 * Tras aprobar el pago en la ventana de PayPal, el navegador vuelve aquí.
 * Llamamos a /api/paypal/capture para confirmar el cobro y marcar la orden.
 */
export function PaypalReturn({ orderId, locale, labels }: Props) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function capture() {
      try {
        const res = await fetch('/api/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (!active) return;
        if (res.ok) {
          setState('ok');
          setTimeout(() => router.push(`/${locale}/descargas`), 1800);
        } else {
          setState('error');
          setMessage(data.error || labels.error);
        }
      } catch {
        if (!active) return;
        setState('error');
        setMessage(labels.error);
      }
    }

    capture();
    return () => {
      active = false;
    };
  }, [orderId, locale, labels.error, router]);

  return (
    <p className={state === 'error' ? 'form-error' : 'sub-success'}>
      {state === 'loading' && labels.loading}
      {state === 'ok' && labels.ok}
      {state === 'error' && message}
    </p>
  );
}
