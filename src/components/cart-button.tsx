'use client';

import { useState } from 'react';
import { useCart } from './cart-provider';
import { formatPrice, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { CheckoutPanel } from './checkout-panel';

export function CartButton({
  dict,
  navLabel,
  removeLabel,
  locale,
}: {
  dict: Dictionary['cart'];
  navLabel: string;
  removeLabel: string;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const { items, count, subtotal, remove } = useCart();

  return (
    <div className="cart-wrap">
      <button
        type="button"
        className="icon-btn"
        aria-expanded={open}
        aria-controls="cart-panel"
        onClick={() => setOpen((v) => !v)}
      >
        {navLabel} <span className="cart-count">{count}</span>
      </button>

      <div className={open ? 'cart-panel open' : 'cart-panel'} id="cart-panel">
        <div className="cart-panel-head">
          <span>{dict.titulo}</span>
          <span>
            {count} {count === 1 ? dict.item : dict.items}
          </span>
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
          <CheckoutPanel dict={dict} locale={locale} onClose={() => setCheckingOut(false)} />
        )}
      </div>
    </div>
  );
}
