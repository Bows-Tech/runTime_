'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { readCart, writeCart, cartSubtotal, cartCount, type CartItem } from '@/lib/cart';

export type { CartItem };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // Hidrata desde localStorage tras el montaje para evitar
  // desajustes entre servidor y cliente.
  useEffect(() => {
    setItems(readCart());
    setReady(true);
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    writeCart(next);
  }, []);

  const add = useCallback(
    (item: CartItem) => {
      const next = [...readCart().filter((i) => i.id !== item.id), item];
      persist(next);
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => persist(readCart().filter((i) => i.id !== id)),
    [persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const has = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items),
      subtotal: cartSubtotal(items),
      ready,
      add,
      remove,
      clear,
      has,
    }),
    [items, ready, add, remove, clear, has],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
