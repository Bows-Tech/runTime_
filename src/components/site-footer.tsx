import Link from 'next/link';
import type { Dictionary } from '@/i18n/dictionaries';

export function SiteFooter({ dict }: { dict: Dictionary['footer'] }) {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-about">
            <Link href="/" className="logo">
              runtime<span>_</span>
            </Link>
            <p>{dict.sobre}</p>
          </div>
          <div>
            <h5>{dict.tienda}</h5>
            <ul>
              <li>
                <Link href="#shop">{dict.todos}</Link>
              </li>
              <li>
                <Link href="#categorias">Categorías</Link>
              </li>
              <li>
                <Link href="#proximamente">Próximamente</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5>{dict.soporte}</h5>
            <ul>
              <li>
                <Link href="#">{dict.documentacion}</Link>
              </li>
              <li>
                <Link href="#">{dict.licencias}</Link>
              </li>
              <li>
                <Link href="#contacto">{dict.todos === 'Todos los scripts' ? 'Contacto' : 'Contact'}</Link>
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

        <div className="footer-bottom">
          <p>© 2026 runtime_. {dict.derechos}</p>
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
