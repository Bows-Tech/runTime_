/**
 * Grupo del panel de administración.
 *
 * No añade ningún layout: el shell con la barra lateral vive en
 * (admin)/admin/layout.tsx, que es donde corresponde porque solo aplica
 * a /admin y sus subrutas.
 *
 * Este archivo existe para documentar la intención: el panel no hereda
 * ni la cabecera ni el pie del sitio, porque no está dentro de (site).
 * Para cambiar el aspecto del panel se edita (admin)/admin/layout.tsx.
 */
export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
