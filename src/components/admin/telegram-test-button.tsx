'use client';

import { useState } from 'react';

type Props = {
  labels: Record<string, string>;
};

/**
 * Boton de prueba del bot de Telegram.
 *
 * Existe porque la unica forma de saber si el token y el chat id son
 * correctos sin montar una venta entera es probandolo. Manda un mensaje de
 * muestra a la cuenta configurada y avisa si llego o no.
 */
export function TelegramTestButton({ labels }: Props) {
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle');
  const [detalle, setDetalle] = useState<string | null>(null);

  async function probar() {
    setEstado('enviando');
    setDetalle(null);

    try {
      const res = await fetch('/api/admin/telegram-test', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      setEstado(res.ok && data.ok ? 'ok' : 'error');
      setDetalle(res.ok && data.ok ? null : data.error || labels.telegramFallo);
    } catch {
      setEstado('error');
      setDetalle(labels.telegramFallo);
    }
  }

  return (
    <div className="telegram-test">
      <button
        type="button"
        className="btn-admin btn-admin--sm"
        onClick={probar}
        disabled={estado === 'enviando'}
      >
        {estado === 'enviando' ? '…' : labels.telegramProbar}
      </button>
      {estado === 'ok' && <span className="telegram-test__ok">{labels.telegramEnviado}</span>}
      {estado === 'error' && (
        <span className="telegram-test__error">{detalle || labels.telegramFallo}</span>
      )}
    </div>
  );
}
