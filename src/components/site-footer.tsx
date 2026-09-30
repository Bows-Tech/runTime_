import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { getLegalInfo } from '@/lib/legal';

export function SiteFooter({
  dict,
  locale,
}: {
  dict: Dictionary['footer'];
  locale: Locale;
}) {
  const es = locale === 'es';
  const info = getLegalInfo();
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-about">
            <Link href={`/${locale}`} className="logo">
              runtime<span>_</span>
            </Link>
            <p>{dict.sobre}</p>
            {info.name && <p className="footer-legal-id">{info.name}</p>}
          </div>

          <div>
            <h5>{dict.tienda}</h5>
            <ul>
              <li>
                <Link href={`/${locale}#shop`}>{dict.todos}</Link>
              </li>
              <li>
                <Link href={`/${locale}#categorias`}>{es ? 'Categorías' : 'Categories'}</Link>
              </li>
              <li>
                <Link href={`/${locale}#proximamente`}>
                  {es ? 'Próximamente' : 'Coming soon'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5>{dict.soporte}</h5>
            <ul>
              <li>
                <Link href={`/${locale}#contacto`}>{es ? 'Contacto' : 'Contact'}</Link>
              </li>
              <li>
                <Link href={`/${locale}/descargas`}>{es ? 'Mis descargas' : 'My downloads'}</Link>
              </li>
              <li>
                <Link href={`/${locale}/reembolsos`}>
                  {es ? 'Reembolsos' : 'Refunds'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5>{dict.siguenos}</h5>
            <ul>
              <li>
                <Link href="#">GitHub</Link>
              </li>
              <li>
                <Link href="#">Twitter / X</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Datos fiscales: muchos países los exigen visibles en el pie. */}
        <div className="footer-legal">
          <Link href={`/${locale}/terminos`}>{es ? 'Términos y condiciones' : 'Terms'}</Link>
          <span>·</span>
          <Link href={`/${locale}/privacidad`}>
            {es ? 'Política de privacidad' : 'Privacy'}
          </Link>
          {info.ruc && (
            <>
              <span>·</span>
              <span>{es ? 'RUC' : 'Tax ID'}: {info.ruc}</span>
            </>
          )}
          {info.email && (
            <>
              <span>·</span>
              <a href={`mailto:${info.email}`}>{info.email}</a>
            </>
          )}
        </div>

        <div className="footer-bottom">
          <p>
            © {year} {info.name || 'runtime_'}. {dict.derechos}
          </p>
          <div className="socials">
            <Link href="#">github</Link>
            <Link href="#">twitter</Link>
            <Link href="#">discord</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}