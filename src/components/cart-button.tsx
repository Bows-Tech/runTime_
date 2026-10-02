'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from './cart-provider';
import { formatPrice, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { CheckoutPanel } from './checkout-panel';

export function CartButton({
  dict,
  navLabel,
  removeLabel,
  closeLabel,
  locale,
  paypalReady = false,
}: {
  dict: Dictionary['cart'];
  navLabel: string;
  removeLabel: string;
  closeLabel: string;
  locale: Locale;
  paypalReady?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const { items, count, subtotal, remove } = useCart();

  // En movil el carrito se ancla abajo y ocupa casi toda la pantalla. Sin
  // bloquear el scroll de fondo, el dedo se va a desplazar la pagina que
  // hay detras en vez de recorrer la lista de productos.
  useEffect(() => {
    if (!open) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previo;
    };
  }, [open]);

  // Escape cierra, y el toque fuera tambien. En escritorio es lo esperable;
  // en movil es la unica salida comoda si no se ve el boton de cerrar.
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  return (
    <div className="cart-wrap" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn"
        aria-expanded={open}
        aria-controls="cart-panel"
        onClick={() => setOpen((v) => !v)}
      >
        {navLabel} <span className="cart-count">{count}</span>
      </button>

      {open && (
        <button
          type="button"
          className="cart-backdrop"
          aria-label={closeLabel}
          onClick={() => setOpen(false)}
        />
      )}

      <div className={open ? 'cart-panel open' : 'cart-panel'} id="cart-panel">
        <div className="cart-panel-head">
          <span>{dict.titulo}</span>
          <div className="cart-panel-head-right">
            <span className="cart-panel-count">
              {count} {count === 1 ? dict.item : dict.items}
            </span>
            {/* Sin este boton, en movil no habria forma de cerrar el
                carrito: el unico control esta en la barra superior, y el
                panel la tapa al anclarse abajo. */}
            <button
              type="button"
              className="cart-close"
              onClick={() => setOpen(false)}
              aria-label={closeLabel}
            >
              ×
            </button>
          </div>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <p className="cart-empty">{dict.vacio}</p>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.id}>
                <div>
                  <strong>
                    {item.name}
                    <span className="ext">.{item.extension}</span>
                  </strong>
                  <p>{formatPrice(item.priceCents, locale)}</p>
                </div>
                <button
                  type="button"
                  className="cart-remove"
                  onClick={() => remove(item.id)}
                  aria-label={`${removeLabel}: ${item.name}`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className="cart-panel-foot">
          <div className="cart-subtotal">
            <span>{dict.subtotal}</span>
            <span>{formatPrice(subtotal, locale)}</span>
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={items.length === 0 || checkingOut}
            onClick={() => setCheckingOut(true)}
          >
            {dict.checkout}
          </button>
        </div>

        {checkingOut && (
          <CheckoutPanel
            dict={dict}
            locale={locale}
            onClose={() => setCheckingOut(false)}
            paypalReady={paypalReady}
          />
        )}
      </div>
    </div>
  );
}
