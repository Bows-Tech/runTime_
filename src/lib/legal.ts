/**
 * Datos legales del sitio.
 *
 * TODO lo que hay aquí sale de variables de entorno. Si alguna está vacía,
 * la página legal lo marca como pendiente en rojo en lugar de publicar un
 * hueco: es mejor que se note que un texto legal incompleto.
 *
 * Rellena esto en .env.local y las páginas se completan solas.
 */

export type LegalInfo = {
  name: string;
  ruc: string;
  address: string;
  email: string;
  phone: string;
};

export function getLegalInfo(): LegalInfo {
  return {
    name: process.env.LEGAL_NAME || '',
    ruc: process.env.LEGAL_RUC || '',
    address: process.env.LEGAL_ADDRESS || '',
    email: process.env.LEGAL_EMAIL || '',
    phone: process.env.LEGAL_PHONE || '',
  };
}

/** Lista los campos sin rellenar, para avisar en la propia página. */
export function missingLegalFields(info: LegalInfo): string[] {
  const labels: Record<keyof LegalInfo, string> = {
    name: 'Nombre o razón social (LEGAL_NAME)',
    ruc: 'RUC (LEGAL_RUC)',
    address: 'Dirección (LEGAL_ADDRESS)',
    email: 'Correo de contacto (LEGAL_EMAIL)',
    phone: 'Teléfono (LEGAL_PHONE)',
  };

  return (Object.keys(labels) as (keyof LegalInfo)[])
    .filter((key) => !info[key])
    .map((key) => labels[key]);
}

/**
 * Marcas el texto como PENDIENTE DE REVISIÓN.
 *
 * Los textos de esta tienda son una plantilla, no un documento jurídico.
 * En Ecuador hay requisitos del SRI sobre comprobantes y datos fiscales
 * que un desarrollador no puede verificar. Antes de publicar, revisa el
 * contenido con un contador.
 *
 * Ponlo en 'false' SOLO cuando un profesional haya revisado el texto.
 */
export function isLegalDraft(): boolean {
  return process.env.LEGAL_DRAFT !== 'false';
}

export const LAST_UPDATED = '2026-09-30';