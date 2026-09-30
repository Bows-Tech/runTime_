// Verifica la validacion de categoria del POST /api/admin/scripts.
// Logica replicada del route handler: no toca la base ni la red.
function validar(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const priceCents = Number(body.priceCents);
  const category = typeof body.category === 'string' ? body.category.trim() : '';

  if (!name || !slug) return 'Nombre y slug son obligatorios';
  if (!Number.isInteger(priceCents) || priceCents < 0) return 'Precio invalido';
  if (!category) return 'Elige una categoria o crea una nueva';
  return null;
}

const casos = [
  [{ name: 'a', slug: 'a', priceCents: 100, category: 'devops' }, null],
  [{ name: 'a', slug: 'a', priceCents: 100, category: '' }, 'Elige una categoria o crea una nueva'],
  [{ name: 'a', slug: 'a', priceCents: 100, category: '   ' }, 'Elige una categoria o crea una nueva'],
  [{ name: 'a', slug: 'a', priceCents: 100, category: '   nueva  ' }, null],
  [{ name: '', slug: 'a', priceCents: 100, category: 'x' }, 'Nombre y slug son obligatorios'],
  [{ name: 'a', slug: 'a', priceCents: -5, category: 'x' }, 'Precio invalido'],
  [{ name: 'a', slug: 'a', priceCents: 1.5, category: 'x' }, 'Precio invalido'],
  [{ name: 'a', slug: 'a', priceCents: 100 }, 'Elige una categoria o crea una nueva'],
];

let fallos = 0;
for (const [body, esperado] of casos) {
  const got = validar(body);
  const ok = got === esperado;
  if (!ok) fallos++;
  console.log(
    `${ok ? 'ok   ' : 'FALLA'} cat=${JSON.stringify(body.category ?? null)} -> ${got ?? '(aceptado)'}`,
  );
}

// Categorias muy largas se recortan a 40 caracteres (limite de la columna).
const largo = 'x'.repeat(80);
console.log(`\nrecorte: '${largo.slice(0, 10)}...' -> '${largo.slice(0, 40).length} chars'`);

console.log(fallos === 0 ? '\nValidacion correcta.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);