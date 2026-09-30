import { getDictionary } from '@/i18n/dictionaries';
import { isLocale } from '@/i18n/config';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CartProvider } from '@/components/cart-provider';

/**
 * Cromo del sitio público: cabecera con carrito y selector de idioma,
 * y pie con enlaces.
 *
 * El panel de administración NO usa este layout (vive en el grupo
 * (admin)), así que no le aparece ni la barra del carrito ni el pie.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'es';
  const dict = getDictionary(locale);

  return (
    <CartProvider>
      <SiteHeader locale={locale} dict={dict.nav} cartDict={dict.cart} />
      <main>{children}</main>
      <SiteFooter dict={dict.footer} />
    </CartProvider>
  );
}
