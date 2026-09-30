import type { Locale } from '@/i18n/config';
import { MyDownloads } from '@/components/my-downloads';

export default async function DescargasPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const es = locale === 'es';

  const labels = es
    ? {
        titulo: 'Mis descargas',
        texto: 'Escribe el correo con el que compraste para recuperar tus enlaces.',
        ver: 'Ver',
        descargar: 'descargar',
        vacio: 'No encontramos compras con ese correo.',
        usado: 'Enlace ya utilizado',
        expirado: 'Enlace expirado',
      }
    : {
        titulo: 'My downloads',
        texto: 'Enter the email you used to buy to recover your links.',
        ver: 'Get',
        descargar: 'download',
        vacio: 'No purchases found for that email.',
        usado: 'Link already used',
        expirado: 'Link expired',
      };

  return (
    <section className="section">
      <div className="wrap">
        <p className="eyebrow">runtime_</p>
        <h1>{labels.titulo}</h1>
        <p style={{ marginBottom: 24 }}>{labels.texto}</p>
        <MyDownloads labels={labels} />
      </div>
    </section>
  );
}
