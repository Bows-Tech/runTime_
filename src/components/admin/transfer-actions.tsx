'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  orderId: string;
  labels: Record<string, string>;
};

/**
 * Botones de confirmar / rechazar una transferencia.
 * 'confirm' es la acción que emite los tokens de descarga, así que
 * solo aparece en órdenes pendientes de tipo transferencia.
 */
export function TransferActions({ orderId, labels }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<'confirm' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: 'confirm' | 'reject') {
    if (action === 'reject' && !window.confirm(labels.confirmReject)) return;

    setBusy(action);
    setError(null);

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    const data = await res.json().catch(() => ({}));
    setBusy(null);

    if (!res.ok) {
      setError(data.error || 'Error');
      return;
    }
    router.refresh();
  }

  return (
    <div className="transfer-actions">
      <div className="admin-row-actions">
        <a
          className="btn-admin btn-admin--sm"
          href={`/api/admin/receipts/${orderId}`}
          target="_blank"
          rel="noreferrer"
        >
          {labels.verComprobante}
        </a>
        <button
          type="button"
          className="btn-admin btn-admin--success btn-admin--sm"
          onClick={() => act('confirm')}
          disabled={busy !== null}
        >
          {busy === 'confirm' ? '…' : labels.confirmar}
        </button>
        <button
          type="button"
          className="btn-admin btn-admin--danger btn-admin--sm"
          onClick={() => act('reject')}
          disabled={busy !== null}
        >
          {busy === 'reject' ? '…' : labels.rechazar}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
