/** URL base del sitio, usada para las redirecciones tras el pago. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}
