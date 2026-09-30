'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { href: string; label: string };

/**
 * Menú lateral del panel.
 *
 * Es un Client Component a propósito, aunque el resto del panel sea
 * servidor. La sección activa depende de la ruta ACTUAL, que cambia en
 * cada clic; resolverla en el servidor no funciona porque los layouts
 * no se reejecutan al navegar entre páginas hijas: el layout queda
 * montado, no se vuelve a pedir al servidor, y el resaltado se
 * congelaba en la sección anterior.
 *
 * Antes se resolvía con un header `x-pathname` en el middleware para
 * evitar hidratar. Parecía una mejora y en la primera carga funcionaba,
 * pero roto el clic. Un componente hidratado es el precio de que el
 * menú responda.
 */
export function AdminNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const hrefs = items.map((item) => item.href);

  return (
    <nav className="admin-nav">
      {items.map((item) => {
        const active = isActive(item.href, pathname, hrefs);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? 'admin-nav-item active' : 'admin-nav-item'}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * La sección activa es la MÁS ESPECÍFICA del menú que sea prefijo de la
 * ruta actual (coincidencia por segmentos, no por cadena cruda).
 *
 * Un `startsWith` a secas no vale: `/es/admin` es prefijo de
 * `/es/admin/ventas` y el dashboard se quedaba marcado en todo el panel.
 * Comparar solo "un segmento de más" tampoco: `/es/admin/ventas` cumple
 * eso y es una sección hermana, no un detalle.
 *
 *   /es/admin            -> dashboard
 *   /es/admin/ventas     -> ventas     (más específica que dashboard)
 *   /es/admin/scripts/42 -> scripts    (detalle, hereda la sección)
 *   /es/admin/a/b/c      -> scripts    (da igual la profundidad)
 */
function isActive(href: string, pathname: string | null, allHrefs: string[]): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;

  const matches = (path: string, section: string) =>
    path === section || path.startsWith(section + '/');

  if (!matches(pathname, href)) return false;

  // Si hay otra sección más profunda que también cubre la ruta, esa gana.
  const hayMasEspecifica = allHrefs.some(
    (other) => other !== href && other.startsWith(href + '/') && matches(pathname, other),
  );

  return !hayMasEspecifica;
}
