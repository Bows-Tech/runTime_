import { notFound } from 'next/navigation';
import { locales, isLocale } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * Layout raíz de idioma: solo valida el locale.
 *
 * Antes se renderizaba aquí la cabecera, el carrito y el pie, lo que
 * obligaba al panel de administración a heredar el pie de la tienda.
 * Con route groups cada grupo envuelve sus páginas con su propio cromo:
 * (site) lleva cabecera y pie, (admin) ninguno de los dos.
 *
 * (site) no aparece en la URL: los grupos entre paréntesis son
 * invisibles para el enrutado.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <div lang={locale}>{children}</div>;
}
