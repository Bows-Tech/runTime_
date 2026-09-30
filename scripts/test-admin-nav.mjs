// Test de la regla de "sección activa" del menú del panel.
// Ejecutar: node scripts/test-admin-nav.mjs
//
// Esta lógica decide qué botón del menú queda resaltado. Es fácil
// dejar el dashboard pegado en todas las páginas, así que va con test.

function isActive(href, pathname, allHrefs) {
  if (!pathname) return false;
  if (pathname === href) return true;

  const matches = (path, section) => path === section || path.startsWith(section + '/');

  if (!matches(pathname, href)) return false;

  const hayMasEspecifica = allHrefs.some(
    (other) => other !== href && other.startsWith(href + '/') && matches(pathname, other),
  );

  return !hayMasEspecifica;
}

// Mismo menú que construye el layout, parametrizado por idioma.
const menu = (locale) => ({
  dashboard: `/${locale}/admin`,
  ventas: `/${locale}/admin/ventas`,
  scripts: `/${locale}/admin/scripts`,
  publicaciones: `/${locale}/admin/publicaciones`,
  clientes: `/${locale}/admin/clientes`,
});

const casos = [
  // Caso que fallaba: el dashboard se quedaba pegado en todo el panel.
  ['/es/admin', 'dashboard'],
  ['/es/admin/ventas', 'ventas'],
  ['/es/admin/scripts', 'scripts'],
  ['/es/admin/publicaciones', 'publicaciones'],
  ['/es/admin/clientes', 'clientes'],
  // Detalle de una sección: debe heredar la sección.
  ['/es/admin/scripts/42', 'scripts'],
  ['/es/admin/scripts/42/editar', 'scripts'],
  ['/es/admin/scripts/abc-123/editar/guardar', 'scripts'],
  // Otro idioma, mismo comportamiento.
  ['/en/admin', 'dashboard'],
  ['/en/admin/ventas', 'ventas'],
  ['/en/admin/scripts/abc-123', 'scripts'],
  ['/en/admin/clientes', 'clientes'],
  // Rutas que no son del panel: ninguna sección activa.
  ['/es', null],
  ['/es/login', null],
  ['/es/descargas', null],
];

let fallos = 0;

for (const [pathname, esperado] of casos) {
  const locale = pathname.split('/')[1];
  const items = menu(locale);
  const hrefs = Object.values(items);

  const activos = Object.keys(items).filter((k) => isActive(items[k], pathname, hrefs));
  const ok = esperados(activos, esperado);

  if (!ok) fallos++;
  console.log(
    `${ok ? 'ok   ' : 'FALLA'} ${pathname.padEnd(38)} esperado=${String(esperado).padEnd(14)} obtenido=${activos.join(',') || '(ninguno)'}`,
  );
}

// Ninguna subsección puede activar el dashboard.
const colados = casos
  .filter(([p]) => !/^\/(es|en)\/admin$/.test(p))
  .filter(([p]) => {
    const items = menu(p.split('/')[1]);
    return isActive(items.dashboard, p, Object.values(items));
  });
if (colados.length) {
  fallos++;
  console.log('FALLA: el dashboard se activa en', colados.map((c) => c[0]));
}

// Nunca dos secciones a la vez.
for (const [pathname] of casos) {
  const items = menu(pathname.split('/')[1]);
  const hrefs = Object.values(items);
  const n = Object.keys(items).filter((k) => isActive(items[k], pathname, hrefs)).length;
  if (n > 1) {
    fallos++;
    console.log(`FALLA: ${pathname} activa ${n} secciones a la vez`);
  }
}

function esperados(activos, esperado) {
  if (esperado === null) return activos.length === 0;
  return activos.length === 1 && activos[0] === esperado;
}

console.log(fallos === 0 ? '\nTodos los casos pasan.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
