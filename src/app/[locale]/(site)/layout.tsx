import { getDictionary } from '@/i18n/dictionaries';
import { isLocale } from '@/i18n/config';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CartProvider } from '@/components/cart-provider';
import { CookieBanner } from '@/components/cookie-banner';

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

  // Leemos esto en el servidor, no en el cliente: las variables
  // NEXT_PUBLIC_* se incrustan al compilar, así que desde el navegador
  // solo cambiarían tras un redespliegue.
  const paypalReady = Boolean(
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET,
  );

  return (
    <CartProvider>
      <SiteHeader
        locale={locale}
        dict={dict.nav}
        cartDict={dict.cart}
        paypalReady={paypalReady}
      />
      <main>{children}</main>
      <SiteFooter locale={locale} dict={dict.footer} />
      <CookieBanner locale={locale} />
    </CartProvider>
  );
}
