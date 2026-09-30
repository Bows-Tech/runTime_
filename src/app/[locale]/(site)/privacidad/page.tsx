import type { Locale } from '@/i18n/config';
import { getLegalInfo, missingLegalFields, isLegalDraft, LAST_UPDATED } from '@/lib/legal';
import { LegalNotice } from '@/components/legal-notice';

export const metadata = { title: 'Política de privacidad · runtime_' };

export default async function PrivacidadPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const es = locale === 'es';
  const info = getLegalInfo();
  const faltan = missingLegalFields(info);

  return (
    <article className="legal">
      <LegalNotice draft={isLegalDraft()} missing={faltan} />

      <h1>{es ? 'Política de privacidad' : 'Privacy policy'}</h1>
      <p className="legal-date">
        {es ? 'Última actualización' : 'Last updated'}: {LAST_UPDATED}
      </p>

      {es ? <PrivacidadEs info={info} /> : <PrivacidadEn info={info} />}
    </article>
  );
}

function PrivacidadEs({ info }: { info: ReturnType<typeof getLegalInfo> }) {
  return (
    <>
      <h2>1. Quién es el responsable</h2>
      <p>
        Este sitio opera bajo la responsabilidad de <strong>{info.name || '[pendiente]'}</strong>
        {info.ruc && (
          <>
            {' '}
            con RUC <strong>{info.ruc}</strong>
          </>
        )}
        , con domicilio en {info.address || '[pendiente]'}. Para cualquier consulta sobre esta
        política escribe a{' '}
        <a href={`mailto:${info.email || 'correo@pendiente'}`}>{info.email || '[pendiente]'}</a>
        {info.phone && <> o llámanos al {info.phone}</>}.
      </p>

      <h2>2. Qué datos recogemos</h2>
      <p>Este sitio recoge únicamente los datos necesarios para procesar una venta:</p>
      <ul>
        <li>
          <strong>Correo electrónico.</strong> Lo introduces tú al comprar. Se usa para
          entregarte el script y avisarte de cualquier incidencia con la compra.
        </li>
        <li>
          <strong>Comprobante de la transferencia.</strong> Si confirmas que pagaste, subes una
          imagen o PDF del comprobante bancario. Lo revisamos únicamente para verificar el pago.
        </li>
        <li>
          <strong>Datos de la compra.</strong> Qué scripts compraste, cuándo y por cuánto. Los
          guardamos para poder atender reclamaciones y emitir el soporte correspondiente.
        </li>
      </ul>
      <p>
        <strong>No usamos cookies publicitarias ni herramientas de seguimiento.</strong> No hay
        Google Analytics, ni píxeles de redes sociales, ni perfiles de terceros. Las fuentes
        tipográficas están alojadas en este mismo servidor y no se solicitan a Google.
      </p>

      <h2>3. Cookies y almacenamiento local</h2>
      <p>El sitio guarda en tu navegador lo siguiente:</p>
      <ul>
        <li>
          <strong>Sesión de autenticación</strong> (cookie): solo si entras al panel de
          administración. Es estrictamente necesaria y se elimina al cerrar sesión.
        </li>
        <li>
          <strong>Idioma preferido</strong> (cookie): para recordar si prefieres español o
          inglés.
        </li>
        <li>
          <strong>Carrito de compra</strong> (almacenamiento local): se queda solo en tu
          dispositivo y se borra al vaciar el carrito o al completar la compra.
        </li>
      </ul>
      <p>Ninguno de estos datos se comparte con terceros ni se utiliza para seguirte por la web.</p>

      <h2>4. Para qué usamos los datos</h2>
      <ul>
        <li>Gestionar la compra y entregarte el producto.</li>
        <li>Verificar pagos y prevenir 대규모.</li>
        <li>Atender solicitudes de soporte o reclamaciones.</li>
        <li>Cumplir obligaciones legales y tributarias aplicables.</li>
      </ul>

      <h2>5. Durante cuánto tiempo los conservamos</h2>
      <p>
        Los datos de tus compras se conservan mientras sean necesarios para atender
        reclamaciones y para cumplir obligaciones legales y tributarias, que en Ecuador
        obligan a conservar los comprobantes de venta durante varios años. Los comprobantes
        bancarios que subes se eliminan cuando dejan de ser necesarios para verificar el pago.
      </p>

      <h2>6. Con quién los compartimos</h2>
      <p>
        No vendemos ni cedemos tus datos. Únicamente se comparten con proveedores de
        infraestructura imprescindibles para operar el sitio (alojamiento y base de datos), y
        cuando exista una obligación legal de hacerlo.
      </p>

      <h2>7. Tus derechos</h2>
      <p>
        Puedes solicitar en cualquier momento acceso a tus datos, su corrección o su
        eliminación escribiendo a{' '}
        <a href={`mailto:${info.email || 'correo@pendiente'}`}>{info.email || '[pendiente]'}</a>.
        Atendemos las solicitudes dentro de los plazos que fija la Ley Orgánica de Protección
        de Datos Personales (LOPD) vigente en Ecuador.
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas razonables para proteger tus datos frente a accesos no
        autorizados: los archivos que compras se guardan en almacenamiento privado y solo se
        entregan mediante enlaces de un solo uso y con fecha de caducidad.
      </p>
    </>
  );
}

function PrivacidadEn({ info }: { info: ReturnType<typeof getLegalInfo> }) {
  return (
    <>
      <h2>1. Data controller</h2>
      <p>
        This site is operated by <strong>{info.name || '[pending]'}</strong>
        {info.ruc && <> (tax ID {info.ruc})</>}, based at {info.address || '[pending]'}.
        Questions about this policy:{' '}
        <a href={`mailto:${info.email || 'email@pending'}`}>{info.email || '[pending]'}</a>
        {info.phone && <> or call {info.phone}</>}.
      </p>

      <h2>2. What data we collect</h2>
      <p>Only the data needed to process a sale:</p>
      <ul>
        <li>
          <strong>Email address.</strong> You enter it at checkout. Used to deliver your
          script and to notify you about the purchase.
        </li>
        <li>
          <strong>Bank transfer receipt.</strong> An image or PDF you upload so we can verify
          the payment. We review it only to confirm the money arrived.
        </li>
        <li>
          <strong>Order data.</strong> Which scripts you bought, when and for how much, kept
          so we can handle claims and issue the required proof of sale.
        </li>
      </ul>
      <p>
        <strong>We use no advertising cookies and no tracking tools.</strong> There is no
        Google Analytics, no social pixels and no third-party profiling. Fonts are served
        from this same server and never requested from Google.
      </p>

      <h2>3. Cookies and local storage</h2>
      <ul>
        <li>
          <strong>Session cookie</strong>: only if you sign in to the admin panel. Strictly
          necessary, removed on sign out.
        </li>
        <li>
          <strong>Language preference</strong> (cookie): so we remember whether you prefer
          Spanish or English.
        </li>
        <li>
          <strong>Shopping cart</strong> (local storage): stays on your device only, cleared
          when you empty the cart or complete a purchase.
        </li>
      </ul>
      <p>None of this data is shared with third parties or used to track you across the web.</p>

      <h2>4. Why we use your data</h2>
      <ul>
        <li>Process the order and deliver the product.</li>
        <li>Verify payments and prevent fraud.</li>
        <li>Handle support requests or claims.</li>
        <li>Meet applicable legal and tax obligations.</li>
      </ul>

      <h2>5. Retention</h2>
      <p>
        Order data is kept as long as needed to handle claims and meet legal and tax
        obligations, which in Ecuador require keeping proof of sale for several years. Bank
        receipts are deleted once they are no longer needed to verify a payment.
      </p>

      <h2>6. Who we share it with</h2>
      <p>
        We do not sell or transfer your data. It is shared only with infrastructure providers
        strictly needed to operate the site (hosting and database), and where a legal
        obligation requires it.
      </p>

      <h2>7. Your rights</h2>
      <p>
        You can request access, correction or deletion of your data at any time by writing to{' '}
        <a href={`mailto:${info.email || 'email@pending'}`}>{info.email || '[pending]'}</a>.
        We handle requests within the deadlines set by Ecuador&rsquo;s data protection law
        (LOPD).
      </p>

      <h2>8. Security</h2>
      <p>
        We apply reasonable technical measures against unauthorized access: purchased files are
        kept in private storage and delivered only through single-use links with an expiry
        date.
      </p>
    </>
  );
}