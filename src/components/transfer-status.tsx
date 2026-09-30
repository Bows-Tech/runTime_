'use client';

import { useEffect, useState } from 'react';
import { formatPrice, formatPriceWithCurrency, type Locale } from '@/i18n/config';

type Download = {
  token: string;
  used: boolean;
  expiresAt: string;
  name: string;
  extension: string;
};

type Props = {
  orderId: string;
  locale: Locale;
  amountCents: number;
  labels: Record<string, string>;
};

/**
 * Pantalla de espera tras transferir.
 *
 * Consulta el estado cada 15 segundos: cuando el admin confirma, los
 * enlaces aparecen aquí mismo. El cliente no tiene que escribir su
 * email ni volver al sitio.
 */
export function TransferStatus({ orderId, locale, amountCents, labels }: Props) {
  const es = locale === 'es';
  const [status, setStatus] = useState<string>('pendiente');
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // 15s entre intentos, creciendo hasta 60s. Antes se consultaba cada
    // 15s indefinidamente incluso con el pago ya confirmado, y cada
    // consulta son 2 viajes a Supabase.
    let delay = 15000;

    async function check() {
      if (!active) return;
      try {
        const res = await fetch(`/api/transferencia/${orderId}/status`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('fallo');

        const data = await res.json();
        if (!active) return;

        setStatus(data.status);
        setDownloads(data.downloads ?? []);
        setError(false);

        // Estado terminal: ya no hay nada que esperar. Cortamos el sondeo.
        if (data.status !== 'pendiente') {
          active = false;
          return;
        }

        // Va espaciando: si llevas minutos esperando, no hay razón para
        // seguir golpeando la API cada 15 segundos.
        delay = Math.min(delay * 2, 60000);
        schedule();
      } catch {
        if (!active) return;
        setError(true);
        delay = Math.min(delay * 2, 60000);
        schedule();
      }
    }

    function schedule() {
      if (!active) return;
      timer = setTimeout(check, delay);
    }

    check();

    // No tiene sentido preguntar con la pestaña oculta: cuando el
    // usuario vuelve, se comprueba al instante.
    function onVisible() {
      if (document.visibilityState === 'visible' && active) {
        delay = 15000;
        check();
      }
    }
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [orderId]);

  if (status === 'pagado') {
    const disponibles = downloads.filter((d) => !d.used && new Date(d.expiresAt) > new Date());
    const usados = downloads.filter((d) => d.used);

    return (
      <div className="status-box paid">
        <h3>{labels.ya_pagado}</h3>

        {disponibles.length > 0 && (
          <ul className="download-list">
            {disponibles.map((d) => (
              <li key={d.token}>
                <div>
                  <strong>
                    {d.name}
                    {d.extension ? `.${d.extension}` : ''}
                  </strong>
                  <p>
                    {labels.expira}{' '}
                    {new Date(d.expiresAt).toLocaleDateString(
                      locale === 'es' ? 'es-MX' : 'en-US',
                    )}
                  </p>
                </div>
                <a className="buy" href={`/api/download/${d.token}`}>
                  {labels.descargar}
                </a>
              </li>
            ))}
          </ul>
        )}

        {disponibles.length === 0 && (
          <p className="small">
            {es
              ? 'Ya usaste los enlaces de esta compra. Si necesitas re-descargar, escríbenos.'
              : 'You already used the links for this purchase. Contact us if you need to re-download.'}
          </p>
        )}

        {usados.length > 0 && usados.length === downloads.length && (
          <p className="small" style={{ marginTop: 12 }}>
            {labels.perdidos}
          </p>
        )}

        <p style={{ marginTop: 20 }}>
          <a href={`/${locale}/descargas`} className="btn-secondary">
            {labels.otra_orden}
          </a>
        </p>
      </div>
    );
  }

  if (status === 'fallido' || status === 'reembolsado') {
    return (
      <div className="status-box">
        <p className="form-error">{labels.rechazada}</p>
        <p className="small">
          {es
            ? 'Si ya transferiste y esto es un error, escríbenos con tu número de orden.'
            : 'If you already transferred and this is a mistake, contact us with your order number.'}
        </p>
      </div>
    );
  }

  // pendiente
  return (
    <div className="status-box">
      <p>
        <strong>{labels.esperando}</strong>
      </p>
      <p className="small">
        {es
          ? 'Estamos verificando tu transferencia. En cuanto se refleje, los enlaces de descarga aparecerán aquí solos.'
          : "We're verifying your transfer. As soon as it clears, the download links will appear here on their own."}
      </p>
      {error && <p className="small">{labels.sin_conexion}</p>}
      <p className="small" style={{ marginTop: 8, opacity: 0.7 }}>
        {formatPriceWithCurrency(amountCents, locale)}
      </p>
    </div>
  );
}
