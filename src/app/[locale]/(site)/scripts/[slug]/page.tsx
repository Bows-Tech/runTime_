import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/public';
import { getDictionary } from '@/i18n/dictionaries';
import { formatPrice, type Locale } from '@/i18n/config';
import { pickTranslation } from '@/lib/supabase/database.types';
import { AddToCartButton } from '@/components/add-to-cart-button';

export const revalidate = 60;

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = getDictionary(locale);
  const supabase = createPublicClient();

  const { data: script } = await supabase
    .from('scripts')
    .select('id, slug, name, extension, price_cents, description, long_description, file_size')
    .eq('slug', slug)
    .eq('status', 'publicado')
    .single();

  if (!script) notFound();

  const long = pickTranslation(script.long_description, locale, '');

  return (
    <section className="section">
      <div className="wrap">
        <p className="eyebrow">.{script.extension}</p>
        <h1>{script.name}</h1>
        <p>{pickTranslation(script.description, locale, '')}</p>

        <div className="card-foot" style={{ marginTop: 32 }}>
          <span className="price">{formatPrice(script.price_cents, locale)}</span>
          <AddToCartButton
            dict={dict.shop}
            script={{
              id: script.id,
              slug: script.slug,
              name: script.name,
              extension: script.extension,
              priceCents: script.price_cents,
            }}
          />
        </div>

        {long && <div style={{ marginTop: 40, maxWidth: 680 }}>{long}</div>}

        <p style={{ marginTop: 40 }}>
          <Link href={`/${locale}/descargas`} className="btn-secondary">
            {locale === 'es' ? '¿Ya compraste? Ver mis descargas' : 'Already bought? Get my downloads'}
          </Link>
        </p>
      </div>
    </section>
  );
}
