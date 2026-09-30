import { createPublicClient } from '@/lib/supabase/public';
import { getDictionary } from '@/i18n/dictionaries';
import { formatPrice, type Locale } from '@/i18n/config';
import { pickTranslation } from '@/lib/supabase/database.types';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { NewsletterForm } from '@/components/newsletter-form';
import { getHomePublication } from '@/lib/publications';
import { SubscribeButton } from '@/components/subscribe-button';

export const revalidate = 60;

// Contenido de ejemplo de la terminal cuando no hay publicación.
const EJEMPLO_TERMINAL_TITULO = 'devops-suite — preview';
const EJEMPLO_TERMINAL = [
  'deploy --canary 10%',
  'Desplegando canary release...',
  'Salud del servicio: nominal',
  'Escalando a 100%... ok',
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  // Catálogo público: cliente sin cookies para que la página pueda
  // prerenderizarse y cachearse.
  const supabase = createPublicClient();

  const { data: scripts } = await supabase
    .from('scripts')
    .select('id, slug, name, extension, price_cents, description')
    .eq('status', 'publicado')
    .order('created_at', { ascending: false });

  const cards = scripts ?? [];
  const featured = cards.slice(0, 4);

  // Bloque "próximo lanzamiento". Si no hay publicación publicada,
  // devuelve null y la sección cae a los textos de ejemplo.
  const pub = await getHomePublication(locale);

  const categories = [
    { n: '01', title: 'Automatización', es: 'Tareas repetitivas, resueltas.', en: 'Repetitive tasks, solved.' },
    { n: '02', title: 'Web Scraping', es: 'Extracción de datos a escala.', en: 'Data extraction at scale.' },
    { n: '03', title: 'DevOps', es: 'CI/CD, despliegues, monitoreo.', en: 'CI/CD, deploys, monitoring.' },
    { n: '04', title: 'Herramientas CLI', es: 'Utilidades para tu terminal.', en: 'Utilities for your terminal.' },
  ];

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">{dict.hero.eyebrow}</p>
            <h1>
              {dict.hero.titulo1}
              <br />
              {dict.hero.titulo2}
              <span className="dim">.</span>
            </h1>
            <p>{dict.hero.texto}</p>
            <div className="hero-cta">
              <a href="#shop" className="btn-primary">
                {dict.hero.cta1}
              </a>
              <a href="#proximamente" className="btn-secondary">
                {dict.hero.cta2}
              </a>
            </div>
          </div>

          <div className="terminal">
            <div className="terminal-bar">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              <span className="terminal-title">zsh — runtime_</span>
            </div>
            <div className="terminal-body">
              <div>
                <span className="prompt">$</span>{' '}
                <span className="cmd">runtime install backup-cli</span>
              </div>
              <div className="out">Descargando backup-cli@2.3.1...</div>
              <div className="out">
                Verificando checksum... <span className="ok">ok</span>
              </div>
              <div className="out">Instalado en ./scripts/backup-cli</div>
              <div>
                <span className="prompt">$</span> <span className="cmd">backup-cli --run</span>
                <span className="cursor" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="shop">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">{dict.shop.eyebrow}</p>
              <h2>{dict.shop.titulo}</h2>
            </div>
            <span className="view-all">{cards.length} {locale === 'es' ? 'scripts' : 'scripts'}</span>
          </div>

          <div className="grid">
            {featured.map((script) => (
              <div className="card" key={script.id}>
                <div className="card-tab">
                  <span className="ext">.{script.extension}</span>
                  <span className="lang">{script.extension}</span>
                </div>
                <div className="card-body">
                  <h3>
                    <a href={`scripts/${script.slug}`}>{script.name}</a>
                  </h3>
                  <p>{pickTranslation(script.description, locale, script.name)}</p>
                  <div className="card-foot">
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
                </div>
              </div>
            ))}

            {featured.length === 0 && (
              <p className="cart-empty">
                {locale === 'es'
                  ? 'Aún no hay scripts publicados.'
                  : 'No published scripts yet.'}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section" id="proximamente">
        <div className="wrap split">
          <div className="split-copy">
            {/* Sin publicaciones, se muestran los textos del diccionario:
                la sección nunca queda vacía ni depende de la base. */}
            <p className="eyebrow">{pub?.eyebrow ?? dict.proximamente.eyebrow}</p>
            <h2>{pub?.title || dict.proximamente.titulo}</h2>
            <p>{pub?.subtitle || dict.proximamente.texto}</p>
            {pub?.badge && <span className="file-badge">{pub.badge}</span>}
            <SubscribeButton label={dict.proximamente.avisar} />
          </div>

          <div className="terminal">
            <div className="terminal-bar">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              <span className="terminal-title">
                {pub?.terminalTitle ?? EJEMPLO_TERMINAL_TITULO}
              </span>
            </div>
            <div className="terminal-body">
              {(pub?.terminalLines ?? EJEMPLO_TERMINAL).map((linea, i) => (
                <div key={i} className="out">
                  {i === 0 ? (
                    <>
                      <span className="prompt">$</span> <span className="cmd">{linea}</span>
                    </>
                  ) : (
                    linea
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="categorias">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">{dict.categorias.eyebrow}</p>
              <h2>{dict.categorias.titulo}</h2>
            </div>
          </div>

          <div className="cats">
            {categories.map((cat) => (
              <a href="#shop" className="cat" key={cat.n}>
                <p className="n">{cat.n}</p>
                <h4>{cat.title}</h4>
                <p>{locale === 'es' ? cat.es : cat.en}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="newsletter" id="contacto">
        <div className="wrap">
          <p className="eyebrow">{dict.contacto.eyebrow}</p>
          <h2>{dict.contacto.titulo}</h2>
          <p>{dict.contacto.texto}</p>
          <NewsletterForm dict={dict.contacto} />
        </div>
      </section>
    </>
  );
}
