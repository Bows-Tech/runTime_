'use client';

import { useState } from 'react';
import { useCart } from './cart-provider';
import { formatPrice, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

/**
 * Si PayPal está disponible. Lo decide el servidor y llega como prop:
 * NEXT_PUBLIC_* se incrusta al compilar, así que leerlo en el cliente
 * obligaría a redesplegar cada vez que se cambian las credenciales.
 */
export type PayPalReady = boolean;

type Props = {
  dict: Dictionary['cart'];
  locale: Locale;
  onClose: () => void;
  paypalReady?: PayPalReady;
};

export function CheckoutPanel({ dict, locale, onClose, paypalReady = false }: Props) {
  const { items, subtotal, clear } = useCart();
  const es = locale === 'es';

  // Transferencia bancaria es la vía principal en Ecuador: no hay
  // comisiones ni retenciones. PayPal queda como alternativa.
  const [method, setMethod] = useState<'transferencia' | 'paypal'>('transferencia');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startTransferencia() {
    setBusy(true);
    setError(null);

    const body = new FormData();
    body.append('email', email);
    body.append('locale', locale);
    // Solo los ids: el precio y el nombre los saca el servidor de la base.
    body.append('items', JSON.stringify(items.map((i) => i.id)));
    body.append('note', note);
    if (file) body.append('receipt', file);

    try {
      const res = await fetch('/api/transferencia', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      clear();
      window.location.href = `/${locale}/transferencia/${data.orderId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setBusy(false);
    }
  }

  async function startPayPal() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          locale,
          items: items.map((i) => ({ id: i.id })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar el pago');
      clear();
      window.location.href = data.approveUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setBusy(false);
    }
  }

  const canSubmit = email && items.length > 0 && (method === 'paypal' || file);

  return (
    <div className="checkout-panel">
      <div className="checkout-head">
        <strong>{dict.checkout}</strong>
        <button type="button" className="cart-remove" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      </div>

      <label className="field">
        <span>{es ? 'Correo para la entrega' : 'Delivery email'}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
        />
      </label>

      <div className="pay-methods" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={method === 'transferencia'}
          className={method === 'transferencia' ? 'active' : ''}
          onClick={() => setMethod('transferencia')}
        >
          {es ? 'Transferencia' : 'Bank transfer'}
        </button>
        {paypalReady && (
          <button
            type="button"
            role="tab"
            aria-selected={method === 'paypal'}
            className={method === 'paypal' ? 'active' : ''}
            onClick={() => setMethod('paypal')}
          >
            {dict.pago_paypal}
          </button>
        )}
      </div>

      {method === 'transferencia' && (
        <div className="transfer-form">
          <label className="field">
            <span>
              {es ? 'Comprobante (imagen o PDF)' : 'Receipt (image or PDF)'}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </label>

          <label className="field">
            <span>
              {es ? 'Referencia del depósito (opcional)' : 'Transfer reference (optional)'}
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={es ? 'Ej: 0012-4471' : 'e.g. 0012-4471'}
            />
          </label>

          <p className="upload-hint">
            {es
              ? 'Te transfieres por el banco y subes el comprobante. Te enviamos la descarga cuando confirmemos el pago.'
              : 'You transfer via your bank and upload the receipt. We send your download once the payment is confirmed.'}
          </p>
        </div>
      )}

      <div className="cart-subtotal">
        <span>{dict.subtotal}</span>
        <span>{formatPrice(subtotal, locale)}</span>
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={busy || !canSubmit}
        onClick={method === 'transferencia' ? startTransferencia : startPayPal}
      >
        {busy
          ? dict.redirect
          : method === 'transferencia'
            ? es
              ? 'Enviar comprobante'
              : 'Submit receipt'
            : dict.pago_paypal}
      </button>

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
