export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Formatea precios como `$10.00`.
 *
 * Antes usaba `style: 'currency'`, que en es-MX devuelve `USD $10.00`.
 * Para una transferencia eso es ruido: el cliente tiene que leer el
 * monto exacto que escribe en su app bancaria, y el prefijo largo
 * distrae. Aquí va el símbolo, y donde importa (instrucciones de pago)
 * se dice aparte que la moneda es USD.
 *
 * El separador decimal sí sigue el del idioma activo, así que en inglés
 * un importe grande se lee bien: `$1,200.00`.
 */
export function formatPrice(cents: number, locale: Locale): string {
  const formatted = new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

  return `$${formatted}`;
}

/** Igual que formatPrice pero con la moneda explícita. Para cobros. */
export function formatPriceWithCurrency(cents: number, locale: Locale): string {
  return locale === 'es'
    ? `${formatPrice(cents, locale)} USD`
    : `USD ${formatPrice(cents, locale)}`;
}
