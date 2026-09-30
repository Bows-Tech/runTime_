import Link from 'next/link';
import type { Locale } from '@/i18n/config';

export default async function GraciasPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  const { session_id } = await searchParams;
  const es = locale === 'es';

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 620 }}>
        <p className="eyebrow">✓</p>
        <h1>{es ? 'Pago completado' : 'Payment complete'}</h1>
        <p>
          {es
            ? 'Recibimos tu pago. Te enviamos los enlaces de descarga a tu correo.'
            : 'We received your payment. We sent the download links to your email.'}
        </p>
        {session_id && (
          <p style={{ marginTop: 12, opacity: 0.6, fontSize: 13 }}>
            ref: {session_id.slice(0, 24)}…
          </p>
        )}
        <p style={{ marginTop: 28 }}>
          <Link href={`/${locale}/descargas`} className="btn-primary">
            {es ? 'Ver mis descargas' : 'Get my downloads'}
          </Link>
        </p>
      </div>
    </section>
  );
}
