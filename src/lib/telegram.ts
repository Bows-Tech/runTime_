/**
 * Avisos al administrador por Telegram.
 *
 * Se usa cuando un comprador sube el comprobante, que es el evento que
 * requiere una accion nuestra. No se avisa al crear el pedido: con la
 * tienda abierta llegan pedidos que nunca se pagan, y avisar de todos
 * acaba haciendo que silenciemos el canal.
 *
 * El envio NUNCA puede romper una compra: si Telegram falla, la compra
 * sigue adelante. Por eso todo se traga los errores.
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export function telegramConfigured(): boolean {
  return Boolean(TOKEN && CHAT_ID);
}

type Venta = {
  orderId: string;
  email: string;
  amountCents: number;
  scripts: string[];
  siteUrl: string;
};

function formatAmount(cents: number): string {
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
  return `$${formatted} USD`;
}

/**
 * Telegram acepta un subset de Markdown. Los datos vienen del comprador
 * (correo, nombre de script), asi que se escapan los caracteres que
 * romperian el formato o inyectarian etiquetas.
 */
function esc(value: string): string {
  return value.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

export async function notifyNewReceipt(venta: Venta): Promise<boolean> {
  // Este wrap no es paranoia: la funcion se invoca con `after()`, y un
  // rechazo sin manejar ahi tumba el proceso de Node. Todo lo que arma
  // el texto (map, slice, join) queda fuera del try de red que hay mas
  // abajo, asi que un dato inesperado reventaria de verdad.
  try {
    return await enviar(venta);
  } catch (err) {
    console.error('[telegram] fallo preparando el aviso:', err instanceof Error ? err.message : err);
    return false;
  }
}

async function enviar(venta: Venta): Promise<boolean> {
  if (!configurado(TOKEN, CHAT_ID)) return false;

  const lineas = venta.scripts.map((s) => `  · ${esc(s)}`).join('\n');
  const ref = venta.orderId.slice(0, 8).toUpperCase();
  const panel = `${venta.siteUrl}/es/admin/ventas`;

  const texto = [
    '🧾 *Venta por confirmar*',
    '',
    `*Ref:* \`${ref}\``,
    `*Correo:* ${esc(venta.email)}`,
    `*Monto:* ${formatAmount(venta.amountCents)}`,
    '',
    '*Scripts:*',
    lineas,
    '',
    `Entra a confirmar: ${panel}`,
    '',
    '_Si no llega el dinero en 24h, rechaza la orden._',
  ].join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: texto,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
      // Corta pronto: si Telegram va lento no queremos alargar el checkout.
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('[telegram] envio rechazado:', res.status, (await res.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    // Silencioso a proposito: el comprador ya pago, no debe ver un error
    // por culpa de la notificacion.
    console.error('[telegram] fallo de red:', err instanceof Error ? err.message : err);
    return false;
  }
}

function configurado(token?: string, chatId?: string): token is string {
  return Boolean(token && chatId);
}

/** Aviso de prueba, para comprobar que el bot y el chat id funcionan. */
export async function sendTestMessage(siteUrl: string): Promise<boolean> {
  if (!configurado(TOKEN, CHAT_ID)) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: [
          '✅ *Avisos activados*',
          '',
          'Te escribo cuando un comprador suba un comprobante.',
          `Panel: ${siteUrl}/es/admin/ventas`,
        ].join('\n'),
        parse_mode: 'Markdown',
      }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });

    return res.ok;
  } catch (err) {
    console.error('[telegram] prueba fallida:', err instanceof Error ? err.message : err);
    return false;
  }
}
