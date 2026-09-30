import type { Locale } from '@/i18n/config';
import { getLegalInfo, missingLegalFields, isLegalDraft, LAST_UPDATED } from '@/lib/legal';
import { LegalNotice } from '@/components/legal-notice';

export const metadata = { title: 'Reembolsos y devoluciones · runtime_' };

export default async function ReembolsosPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const es = locale === 'es';
  const info = getLegalInfo();

  return (
    <article className="legal">
      <LegalNotice draft={isLegalDraft()} missing={missingLegalFields(info)} />

      <h1>{es ? 'Reembolsos y devoluciones' : 'Refunds and returns'}</h1>
      <p className="legal-date">
        {es ? 'Última actualización' : 'Last updated'}: {LAST_UPDATED}
      </p>

      {es ? <ReembolsosEs info={info} /> : <ReembolsosEn info={info} />}
    </article>
  );
}

function ReembolsosEs({ info }: { info: ReturnType<typeof getLegalInfo> }) {
  return (
    <>
      <p>
        <strong>Resumen:</strong> como entregamos productos digitales de forma inmediata tras
        confirmar el pago, no existe el derecho de desistimiento una vez descargado el script.
        Sí aceptamos reembolso en los casos descritos abajo.
      </p>

      <h2>1. Producto digital y entrega inmediata</h2>
      <p>
        Los scripts se entregan mediante enlaces de descarga. En cuanto confirmamos tu pago,
        tienes acceso inmediato al producto. Por esa razón, y salvo que exista una causa
        justificada, <strong>no aceptamos devoluciones de scripts ya descargados</strong>.
      </p>

      <h2>2. Sí hay reembolso cuando el script no funciona</h2>
      <p>
        Si compraste un script y <strong>no hace lo que su descripción indica</strong> en un
        entorno compatible, tienes derecho a la devolución del importe. Escríbenos dentro de
        los <strong>7 días</strong> siguientes a la compra, indicando:
      </p>
      <ul>
        <li>Tu correo de compra.</li>
        <li>El nombre del script.</li>
        <li>Qué esperabas y qué ocurrió, con el mensaje de error si lo hay.</li>
      </ul>
      <p>
        Lo revisamos y, si se confirma el fallo, te devolvemos el 100% del importe por la misma
        vía con la que pagaste.
      </p>

      <h2>3. El script no hace lo que esperabas</h2>
      <p>
        Diferencia entre un fallo y una expectativa. Si el script funciona exactamente como
        dice su descripción pero no cubre un caso que necesitabas, <strong>no hay
        reembolso</strong>. Esto se debe a que la ficha de cada producto describe lo que hace
        de forma concreta: léela antes de comprar.
      </p>
      <p>
        Si el error es tuyo al ejecutarlo (sistema operativo, versión del lenguaje o
        dependencias que no cumples) y el script funciona en el entorno indicado, tampoco hay
        reembolso.
      </p>

      <h2>4. Compras no confirmadas</h2>
      <p>
        Si hiciste una transferencia pero <strong>nunca se confirmó el pago</strong> y no
        recibiste el producto, escríbenos. Verificamos y devolvemos el dinero.
      </p>

      <h2>5. Compras duplicadas</h2>
      <p>
        Si pagaste dos veces el mismo script por error, escríbenos con ambos comprobantes y
        devolvemos el cobro duplicado.
      </p>

      <h2>6. Cómo se devuelve el dinero</h2>
      <ul>
        <li>
          La devolución se hace a <strong>la misma cuenta</strong> desde la que recibiste el
          pago.
        </li>
        <li>El plazo depende de tu entidad financiera: entre 3 y 15 días hábiles.</li>
        <li>Las comisiones retenidas por tu banco no están sujetas a devolución.</li>
      </ul>

      <h2>7. Comprueba antes de comprar</h2>
      <p>Para evitar problemas:</p>
      <ul>
        <li>Lee la descripción completa del script.</li>
        <li>Revisa que tu sistema cumple los requisitos técnicos indicados.</li>
        <li>Si tienes dudas, <strong>pregunta antes de pagar</strong>.</li>
      </ul>

      <h2>8. Plazo de desistimiento</h2>
      <p>
        Como la entrega es inmediata tras la confirmación del pago, el plazo de desistimiento
        del que habla la Ley Orgánica de Protección del Consumidor NO se aplica a productos
        digitales con entrega inmediata, conforme a las exclusiones previstas en dicha norma.
        Aun así, si tu caso es distinto y te corresponde, <strong>nosotros lo evaluamos y lo
        aceptamos</strong>: escríbenos y lo vemos caso por caso.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Escríbenos a{' '}
        <a href={`mailto:${info.email || 'correo@pendiente'}`}>{info.email || '[pendiente]'}</a>
        {info.phone && <> o llámanos al {info.phone}</>}. Respondemos en menos de 48 horas
        hábiles.
      </p>
    </>
  );
}

function ReembolsosEn({ info }: { info: ReturnType<typeof getLegalInfo> }) {
  return (
    <>
      <p>
        <strong>Summary:</strong> because we deliver digital products immediately once payment
        is confirmed, there is no withdrawal right once the script has been downloaded. We do
        accept refunds in the cases below.
      </p>

      <h2>1. Digital product, immediate delivery</h2>
      <p>
        Scripts are delivered via download links. As soon as we confirm payment you have
        immediate access. For that reason, unless there is a justified cause,{' '}
        <strong>we do not accept returns of downloaded scripts</strong>.
      </p>

      <h2>2. Refunds are accepted when the script does not work</h2>
      <p>
        If a script <strong>doesn&rsquo;t do what its description says</strong> in a compatible
        environment, you&rsquo;re entitled to a refund. Contact us within{' '}
        <strong>7 days</strong> of purchase with:
      </p>
      <ul>
        <li>Your purchase email.</li>
        <li>The script name.</li>
        <li>What you expected and what happened, including any error message.</li>
      </ul>
      <p>We review it and, if the fault is confirmed, refund 100% by the original payment route.</p>

      <h2>3. When the script simply isn&rsquo;t what you expected</h2>
      <p>
        There is a difference between a fault and an expectation. If the script does exactly
        what its description says but doesn&rsquo;t cover a case you needed,{' '}
        <strong>there is no refund</strong>. Each product page describes concretely what it
        does: please read it before buying.
      </p>

      <h2>4. Unconfirmed payments</h2>
      <p>
        If you transferred but the payment was <strong>never confirmed</strong> and you never
        received the product, contact us. We verify and refund.
      </p>

      <h2>5. Duplicate purchases</h2>
      <p>If you were charged twice for the same script by mistake, contact us with both receipts.</p>

      <h2>6. How refunds are issued</h2>
      <ul>
        <li>Refunds go to <strong>the same account</strong> that received the payment.</li>
        <li>Timing depends on your bank: between 3 and 15 business days.</li>
        <li>Bank fees are not refundable.</li>
      </ul>

      <h2>7. Check before buying</h2>
      <ul>
        <li>Read the full description.</li>
        <li>Check your system meets the stated requirements.</li>
        <li>If in doubt, <strong>ask before paying</strong>.</li>
      </ul>

      <h2>8. Right of withdrawal</h2>
      <p>
        Because delivery is immediate after payment confirmation, the statutory withdrawal
        period does not apply to digital products delivered immediately. Even so, if your case
        is different, <strong>we review it case by case</strong> and will honour it.
      </p>

      <h2>9. Contact</h2>
      <p>
        Write to{' '}
        <a href={`mailto:${info.email || 'email@pending'}`}>{info.email || '[pending]'}</a>
        {info.phone && <> or call {info.phone}</>}. We reply within 48 business hours.
      </p>
    </>
  );
}