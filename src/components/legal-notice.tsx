import { isLegalDraft, missingLegalFields, getLegalInfo } from '@/lib/legal';

/**
 * Aviso que aparece arriba de las páginas legales.
 *
 * Hace dos cosas: avisa de que el texto es una plantilla que necesita
 * revisión profesional, y señala los datos que faltan por rellenar.
 * Ambas advertencias desaparecen solas cuando completas .env.local y
 * pones LEGAL_DRAFT=false.
 */
export function LegalNotice({ draft, missing }: { draft: boolean; missing: string[] }) {
  if (!draft && missing.length === 0) return null;

  return (
    <div className="legal-notice">
      {draft && (
        <p>
          <strong>Texto pendiente de revisión profesional.</strong> Esta es una plantilla de
          referencia, no un documento jurídico validado. Antes de publicar, revisa el contenido
          con un contador o abogado, en especial lo relativo a facturación y obligaciones
          tributarias en Ecuador.
        </p>
      )}

      {missing.length > 0 && (
        <p>
          <strong>Faltan datos por completar:</strong> {missing.join(' · ')}. Añádelos a
          <code>.env.local</code> para que aparezcan correctamente.
        </p>
      )}
    </div>
  );
}