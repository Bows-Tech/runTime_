// Comprueba el escapado del Markdown de Telegram.
// Ejecutar: node scripts/test-telegram.mjs
//
// El aviso se arma con parse_mode: 'Markdown' y los datos vienen del
// comprador (correo) y del admin (nombre del script). Un guion bajo o un
// asterisco sin escapar hace que Telegram rechace el mensaje entero con un
// 400 y el aviso se pierde justo cuando mas urge.

function esc(value) {
  return value.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

const casos = [
  ['scraper_instagram', 'scraper\\_instagram', 'guion bajo'],
  ['bot *ventas* rapido', 'bot \\*ventas\\* rapido', 'asteriscos'],
  ['correo con [corchetes]', 'correo con \\[corchetes\\]', 'corchetes'],
  ['a|b-c', 'a\\|b\\-c', 'barra y guion'],
  ['punto.al.final', 'punto\\.al\\.final', 'puntos'],
  ['[click](http://malo)', '\\[click\\]\\(http://malo\\)', 'inyeccion de enlace'],
  ['normal sin nada raro', 'normal sin nada raro', 'texto limpio'],
];

let fallos = 0;
for (const [entrada, esperado, nota] of casos) {
  const got = esc(entrada);
  const ok = got === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? 'ok  ' : 'FALLA'} ${nota}`);
  if (!ok) console.log(`       esperado: ${esperado}\n       obtenido: ${got}`);
}

// Una barra invertida literal en el nombre debe duplicarse: Telegram
// desescapa una sola vez y asi muestra una barra y no un fallo de formato.
// OJO: esc() NO es idempotente a proposito (esc(esc(x)) != x) y no debe
// serlo. El codigo escapa una unica vez, con el nombre tal cual viene de
// la base. Escribir esta prueba como "escapar dos veces no cambia nada"
// seria falsa, y por eso se comprueba la barra invertida en su lugar.
const conBarra = esc('carpeta\\mid\\nombre');
const okBarra = conBarra === 'carpeta\\\\mid\\\\nombre';
if (!okBarra) fallos++;
console.log(`${okBarra ? 'ok  ' : 'FALLA'} barra invertida duplicada`);
if (!okBarra) console.log(`       obtenido: ${conBarra}`);

// El precio sale de la base, pero el formato tambien debe ser estable.
function formatAmount(cents) {
  const f = new Intl.NumberFormat('es-MX', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
  return `$${f} USD`;
}
const precios = [
  [800, '$8.00 USD'],
  [150000, '$1,500.00 USD'],
];
for (const [cents, esperado] of precios) {
  const got = formatAmount(cents);
  const ok = got === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? 'ok  ' : 'FALLA'} monto ${cents} -> ${got}`);
}

// El aviso corre dentro de `after()`. Un rechazo SIN MANEJAR ahi tumba el
// proceso de Node, asi que notifyNewReceipt envuelve su propio cuerpo.
// Esta copia reproduce esa estructura para comprobar que ni un dato
// raro (scripts undefined, nombre no string) escapa como rechazo.
async function notificarSimulado(venta) {
  try {
    return await enviarSimulado(venta);
  } catch {
    return false;
  }
}
async function enviarSimulado(venta) {
  const lineas = venta.scripts.map((s) => `  · ${esc(s)}`).join('\n');
  return lineas.length > 0;
}

const entradasRobustas = [
  [{ orderId: 'x', email: 'a@b.co', amountCents: 800, scripts: ['ok'], siteUrl: 'u' }, true],
  [{ orderId: 'x', email: 'a@b.co', amountCents: 800, scripts: [], siteUrl: 'u' }, false],
  [{ orderId: 'x', email: 'a@b.co', amountCents: 800, siteUrl: 'u' }, false],
  [{ orderId: 'x', email: 'a@b.co', amountCents: 800, scripts: [null], siteUrl: 'u' }, false],
];
for (const [venta, esperado] of entradasRobustas) {
  let ok = false;
  try {
    ok = (await notificarSimulado(venta)) === esperado;
  } catch (err) {
    console.log(`FALLA el aviso escapo como rechazo: ${err.message}`);
    fallos++;
    continue;
  }
  if (!ok) fallos++;
  console.log(`${ok ? 'ok  ' : 'FALLA'} dato raro (${JSON.stringify(venta.scripts)}) no tumba la venta`);
}

console.log(fallos === 0 ? '\nTodo correcto.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
