import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSiteUrl } from '@/lib/site';
import { sendTestMessage, telegramConfigured } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

/**
 * Comprobacion manual del bot: el unico jeito de saber si el token y el
 * chat id son correctos sin tener que hacer una venta de prueba.
 */
export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!telegramConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_ADMIN_CHAT_ID en las variables de entorno',
      },
      { status: 503 },
    );
  }

  const ok = await sendTestMessage(getSiteUrl());
  return NextResponse.json({ ok });
}
