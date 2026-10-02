'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { locales, localeNames, isLocale, type Locale } from '@/i18n/config';
import { setLocale } from '@/lib/cart';
import type { Dictionary } from '@/i18n/dictionaries';
import { CartButton } from './cart-button';
import { AuthNavLink } from './auth-nav-link';

export function SiteHeader({
  locale,
  dict,
  cartDict,
  paypalReady = false,
}: {
  locale: Locale;
  dict: Dictionary['nav'];
  cartDict: Dictionary['cart'];
  paypalReady?: boolean;
}) {
  const pathname = usePathname();
  const base = `/${locale}`;

  const links = [
    { href: `${base}#shop`, label: dict.shop },
    { href: `${base}#categorias`, label: dict.categorias },
    { href: `${base}#proximamente`, label: dict.proximamente },
    { href: `${base}#contacto`, label: dict.contacto },
  ];

  return (
    <header>
      <div className="wrap nav">
        <Link href={base} className="logo">
          runtime<span>_</span>
        </Link>

        <input type="checkbox" id="menu-toggle" className="menu-toggle" />
        <ul className="nav-links">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <label className="lang-select">
            <span className="sr-only">Idioma</span>
            <select
              value={locale}
              onChange={(event) => {
                const next = event.target.value;
                if (isLocale(next)) setLocale(next);
              }}
            >
              {locales.map((code) => (
                <option key={code} value={code}>
                  {localeNames[code]}
                </option>
              ))}
            </select>
          </label>

          <AuthNavLink href={`${base}/login`} label={dict.login} locale={locale} />

          <CartButton
            dict={cartDict}
            navLabel={dict.carrito}
            removeLabel={cartDict.quitar}
            closeLabel={cartDict.cerrar}
            locale={locale}
            paypalReady={paypalReady}
          />

          <label htmlFor="menu-toggle" className="menu-toggle-label">
            ☰
          </label>
        </div>
      </div>
    </header>
  );
}
