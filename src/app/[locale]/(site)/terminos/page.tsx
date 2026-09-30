import type { Locale } from '@/i18n/config';
import { getLegalInfo, missingLegalFields, isLegalDraft, LAST_UPDATED } from '@/lib/legal';
import { LegalNotice } from '@/components/legal-notice';

export const metadata = { title: 'Términos y condiciones · runtime_' };

export default async function TerminosPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const es = locale === 'es';
  const info = getLegalInfo();

  return (
    <article className="legal">
      <LegalNotice draft={isLegalDraft()} missing={missingLegalFields(info)} />

      <h1>{es ? 'Términos y condiciones' : 'Terms and conditions'}</h1>
      <p className="legal-date">
        {es ? 'Última actualización' : 'Last updated'}: {LAST_UPDATED}
      </p>

      {es ? <TerminosEs info={info} /> : <TerminosEn info={info} />}
    </article>
  );
}

function TerminosEs({ info }: { info: ReturnType<typeof getLegalInfo> }) {
  return (
    <>
      <p>
        Estos términos regulan el acceso y las compras en este sitio, operado por{' '}
        <strong>{info.name || '[pendiente]'}</strong>
        {info.ruc && <> (RUC {info.ruc})</>}. Al comprar aceptas lo que se indica a
        continuación.
      </p>

      <h2>1. Qué vendemos</h2>
      <p>
        Este sitio vende scripts y utilidades de software: programas que se entregan
        <strong> en formato digital</strong>, listos para descargar y ejecutar. Cada producto
        indica su lenguaje, sus requisitos y lo que hace.
      </p>

      <h2>2. Cómo se realiza una compra</h2>
      <ol>
        <li>Eliges los scripts y los agregas al carrito.</li>
        <li>Introduces tu correo electrónico, que es donde recibes la entrega.</li>
        <li>Eliges el pago por transferencia bancaria y recibes los datos de la cuenta.</li>
        <li>Transferes el importe exacto y subes el comprobante.</li>
        <li>Revisamos el pago y, una vez confirmado, se habilitan tus enlaces de descarga.</li>
      </ol>
      <p>
        <strong>La entrega no es automática.</strong> Se habilita cuando verificamos que el
        dinero llegó. Si haces la transferencia pero no subes el comprobante, o si el
        comprobante no coincide con el pedido, escríbenos y lo resolvemos.
      </p>

      <h2>3. Precios y pagos</h2>
      <ul>
        <li>Todos los precios se expresan en dólares de los Estados Unidos (USD).</li>
        <li>El precio que pagas es el que aparece en el carrito en el momento de comprar.</li>
        <li>
          Los cargos de tu banco o de la entidad financiera intermediaria no están incluidos
          y corren de tu cuenta.
        </li>
      </ul>

      <h2>4. Entrega</h2>
      <ul>
        <li>La entrega es inmediata tras la confirmación del pago.</li>
        <li>
          Los enlaces de descarga son <strong>de un solo uso</strong> y caducan a los 7 días.
        </li>
        <li>Si el enlace expira o ya fue usado, escríbenos y te lo reenviamos.</li>
        <li>Las claves de acceso se guardan en tu navegador; no hace falta crear cuenta.</li>
      </ul>

      <h2>5. Licencia de uso</h2>
      <p>
        Al comprar obtienes una <strong>licencia personal y no exclusiva</strong> para usar el
        script. Puedes usarlo, modificarlo y ejecutarlo donde quieras, incluso en proyectos
        comerciales.
      </p>
      <p>No puedes:</p>
      <ul>
        <li>Revender el script tal cual, ni empaquetarlo para venderlo.</li>
        <li>Publicar el código fuente del script para que otros lo usen.</li>
        <li>Reclamar autoría sobre el producto.</li>
      </ul>
      <p>
        Si quieres revenderlo como parte de un producto o servicio propio, escríbenos y
        acordamos una licencia distinto.
      </p>

      <h2>6. Requisitos técnicos</h2>
      <p>
        Los scripts están escritos para un sistema operativo y lenguaje concretos, indicados en
        la ficha de cada producto. <strong>No incluye instalación, configuración ni soporte
        técnico.</strong> Si un script no funciona en tu entorno, escríbenos dentro de los 7
        días del pago y lo revisamos.
      </p>

      <h2>7. Garantía y responsabilidad</h2>
      <ul>
        <li>
          Garantizamos que el script hace lo que su descripción indica en un entorno
          compatible.
        </li>
        <li>
          <strong>No garantizamos resultados específicos</strong> derivados del uso de un
          script en sistemas reales.
        </li>
        <li>No respondemos por daños indirectos, pérdida de datos o lucro cesante.</li>
        <li>Tu responsabilidad es revisar el script antes de usarlo en producción.</li>
      </ul>

      <h2>8. Conducta aceptable</h2>
      <p>
        No puedes usar el sitio para actividades ilegales, para atacar el sistema o para
        vulnerar los derechos de terceros. Podemos suspender el acceso a quien lo haga.
      </p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        Salvo dolo o culpa inexculpable, nuestra responsabilidad total frente a ti se limita
        al importe que pagaste por el script concreto.
      </p>

      <h2>10. Ley aplicable y jurisdicción</h2>
      <p>
        Estos términos se rigen por las leyes de la República del Ecuador. Cualquier controversia
        se someterá a los jueces del domicilio de {info.address || '[domicilio del operador]'},
        renunciando las partes a cualquier otro fuero.
      </p>

      <h2>11. Cambios en estos términos</h2>
      <p>
        Podemos actualizar estos términos. Los cambios se publicarán en esta página con su
        fecha de actualización. Las compras ya realizadas se rigen por los términos vigentes en
        el momento de la compra.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Para cualquier consulta sobre estos términos:{' '}
        <a href={`mailto:${info.email || 'correo@pendiente'}`}>{info.email || '[pendiente]'}</a>
        {info.phone && <> · {info.phone}</>}.
      </p>
    </>
  );
}

function TerminosEn({ info }: { info: ReturnType<typeof getLegalInfo> }) {
  return (
    <>
      <p>
        These terms govern access and purchases on this site, operated by{' '}
        <strong>{info.name || '[pending]'}</strong>
        {info.ruc && <> (tax ID {info.ruc})</>}. By buying you accept the following.
      </p>

      <h2>1. What we sell</h2>
      <p>
        This site sells scripts and software utilities delivered
        <strong> digitally</strong>, ready to download and run. Each product states its
        language, requirements and what it does.
      </p>

      <h2>2. How a purchase works</h2>
      <ol>
        <li>You pick the scripts and add them to the cart.</li>
        <li>You enter your email, which is where delivery goes.</li>
        <li>You choose bank transfer and receive the account details.</li>
        <li>You transfer the exact amount and upload the receipt.</li>
        <li>We verify the payment and enable your download links.</li>
      </ol>
      <p>
        <strong>Delivery is not automatic.</strong> Links are enabled once we confirm the money
        arrived. If you transfer but don&rsquo;t upload a receipt, or the receipt doesn&rsquo;t
        match the order, contact us and we&rsquo;ll sort it out.
      </p>

      <h2>3. Prices and payment</h2>
      <ul>
        <li>All prices are in United States dollars (USD).</li>
        <li>You pay the price shown in the cart at the moment of purchase.</li>
        <li>Your bank&rsquo;s fees are not included and are borne by you.</li>
      </ul>

      <h2>4. Delivery</h2>
      <ul>
        <li>Delivery is immediate once the payment is confirmed.</li>
        <li>
          Download links are <strong>single use</strong> and expire after 7 days.
        </li>
        <li>If a link expired or was already used, contact us and we&rsquo;ll resend it.</li>
        <li>Your access keys stay in your browser; no account required.</li>
      </ul>

      <h2>5. Licence</h2>
      <p>
        A purchase grants a <strong>personal, non-exclusive licence</strong>. You may use,
        modify and run the script anywhere, including commercial projects.
      </p>
      <p>You may not:</p>
      <ul>
        <li>Resell the script as-is or bundle it for sale.</li>
        <li>Publish the source code so others can use it.</li>
        <li>Claim authorship of the product.</li>
      </ul>
      <p>
        To resell it as part of your own product or service, contact us to arrange a different
        licence.
      </p>

      <h2>6. Technical requirements</h2>
      <p>
        Scripts target a specific operating system and language, stated on each product page.{' '}
        <strong>Installation, configuration and technical support are not included.</strong> If a
        script doesn&rsquo;t work in your environment, contact us within 7 days of payment.
      </p>

      <h2>7. Warranty and liability</h2>
      <ul>
        <li>We guarantee the script does what its description says in a compatible environment.</li>
        <li>
          <strong>We do not guarantee specific results</strong> from using a script in real
          systems.
        </li>
        <li>We are not liable for indirect damages, data loss or lost profit.</li>
        <li>You are responsible for reviewing a script before using it in production.</li>
      </ul>

      <h2>8. Acceptable use</h2>
      <p>
        You may not use the site for illegal activity, to attack the system or to infringe
        third-party rights. We may suspend access for anyone who does.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        Except for intent or gross negligence, our total liability to you is limited to the
        amount you paid for the specific script.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of the Republic of Ecuador. Any dispute is
        subject to the courts of {info.address || '[operator address]'}.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these terms. Changes will appear on this page with their date. Existing
        purchases remain governed by the terms in force at the time of purchase.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these terms:{' '}
        <a href={`mailto:${info.email || 'email@pending'}`}>{info.email || '[pending]'}</a>
        {info.phone && <> · {info.phone}</>}.
      </p>
    </>
  );
}