'use client';

import { createClient } from '@/lib/supabase/client';
import type { Locale } from '@/i18n/config';
import { formatPrice } from '@/i18n/config';
import { locales } from '@/i18n/config';

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  extension: string;
  priceCents: number;
};

const STORAGE_KEY = 'runtime_cart_v1';

export function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.priceCents, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.length;
}

/**
 * Guarda el idioma en una cookie para que el middleware pueda redirigir.
 * Además lo persiste en localStorage como respaldo.
 */
export async function setLocale(next: Locale): Promise<void> {
  document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
  try {
    window.localStorage.setItem('runtime_locale', next);
  } catch {
    /* modo privado */
  }

  // Refresca la sesión de Supabase para que las cookies queden actualizadas.
  try {
    await createClient().auth.getUser();
  } catch {
    /* sin sesión: no pasa nada */
  }

  const segments = window.location.pathname.split('/');
  if (segments[1] && locales.includes(segments[1] as Locale)) {
    segments[1] = next;
  } else {
    segments.splice(1, 0, next);
  }
  const qs = window.location.search;
  window.location.href = segments.join('/') + qs;
}

export { formatPrice };
