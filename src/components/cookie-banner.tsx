'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';

const STORAGE_KEY = 'runtime_cookie_consent';

type Props = { locale: Locale };

/**
 * Aviso de cookies.
 *
 * El sitio NO usa cookies de seguimiento: no hay analítica, ni píxeles,
 * ni fuentes de terceros. Solo hay almacenamiento estrictamente
 * necesario (sesión de admin, idioma y carrito). Por eso el aviso
 * informa en lugar de pedir una decisión que no altera nada: aceptar
 * o rechazar da el mismo resultado.
 *
 * Guardamos la preferencia en localStorage para no mostrar el aviso en
 * cada visita.
 */
export function CookieBanner({ locale }: Props) {
  const es = locale === 'es';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        // Un frame de retraso para que no aparezca durante la hidratación.
        const t = setTimeout(() => setVisible(true), 400);
        return () => clearTimeout(t);
      }
    } catch {
      /* modo privado: sin aviso, el sitio funciona igual */
    }
  }, []);

  function close() {
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* sin persistencia: se ocultará en la próxima carga */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label={es ? 'Aviso de cookies' : 'Cookie notice'}>
      <div className="cookie-text">
        <strong>{es ? 'Cookies y privacidad' : 'Cookies and privacy'}</strong>
        <p>
          {es ? (
            <>
              Este sitio no usa cookies publicitarias ni herramientas de seguimiento. Solo
              guardamos lo necesario para que funcione: tu idioma, el carrito y, si entras al
              panel, tu sesión. Puedes leer el detalle en la{' '}
              <Link href={`/${locale}/privacidad`}>política de privacidad</Link>.
            </>
          ) : (
            <>
              This site uses no advertising cookies and no tracking tools. We only store what is
              needed for the site to work: your language, your cart and, if you sign in to the
              panel, your session. Details in the{' '}
              <Link href={`/${locale}/privacidad`}>privacy policy</Link>.
            </>
          )}
        </p>
      </div>
      <div className="cookie-actions">
        <button type="button" className="btn-admin btn-admin--sm" onClick={close}>
          {es ? 'Entendido' : 'Understood'}
        </button>
      </div>
    </div>
  );
}