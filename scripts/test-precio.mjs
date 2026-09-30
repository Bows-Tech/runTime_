// Comprueba el formato del precio. Ejecutar: node scripts/test-precio.mjs
function formatPrice(cents, locale) {
  const formatted = new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
  return '$' + formatted;
}

function formatPriceWithCurrency(cents, locale) {
  return locale === 'es'
    ? formatPrice(cents, locale) + ' USD'
    : 'USD ' + formatPrice(cents, locale);
}

const casos = [
  [800, '$8.00'],
  [1200, '$12.00'],
  [100000, '$1,000.00'],
  [1250000, '$12,500.00'],
];

let fallos = 0;
console.log('--- es-MX ---');
for (const [c, esperado] of casos) {
  const got = formatPrice(c, 'es');
  const ok = got === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? 'ok   ' : 'FALLA'} ${String(c).padStart(8)} -> ${got.padEnd(14)} (esperado ${esperado})`);
}

console.log('--- en-US ---');
for (const [c] of casos) {
  console.log(`      ${String(c).padStart(8)} -> ${formatPrice(c, 'en').padEnd(14)} con moneda: ${formatPriceWithCurrency(c, 'en')}`);
}
console.log(`      moneda es: ${formatPriceWithCurrency(1200, 'es')}`);

// Requisito: nunca debe aparecer el prefijo largo "USD $" junto al simbolo.
for (const [c] of casos) {
  for (const loc of ['es', 'en']) {
    const out = formatPrice(c, loc);
    if (/USD\s*\$/.test(out)) {
      fallos++;
      console.log(`FALLA: ${loc} sigue mostrando "USD $": ${out}`);
    }
  }
}

console.log(fallos === 0 ? '\nFormato correcto.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);