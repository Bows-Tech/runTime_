'use client';

import { useState } from 'react';
import { useCart, type CartItem } from './cart-provider';
import type { Dictionary } from '@/i18n/dictionaries';

export function AddToCartButton({
  dict,
  script,
}: {
  dict: Dictionary['shop'];
  script: CartItem;
}) {
  const { add, has } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handle() {
    add(script);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <button type="button" className="buy" onClick={handle}>
      {justAdded ? (has(script.id) ? '✓' : '—') : dict.comprar}
    </button>
  );
}
