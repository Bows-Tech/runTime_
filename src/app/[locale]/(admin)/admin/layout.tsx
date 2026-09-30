import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getDictionary } from '@/i18n/dictionaries';
import { isLocale, type Locale } from '@/i18n/config';
import { AdminNav } from '@/components/admin-nav';
import { LogoutButton } from '@/components/logout-button';

export const dynamic = 'force-dynamic';

/**
 * Layout del panel: exige sesión de admin en el servidor ANTES de
 * renderizar cualquier dato. Todas las páginas hijas heredan esta
 * protección, y cada Route Handler vuelve a validarla por su cuenta.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'es';

  if (!(await isAdmin())) {
    redirect(`/${locale}/login`);
  }

  const dict = getDictionary(locale);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          runtime<span>_</span>
          <small>{dict.admin.panel}</small>
        </div>
        <AdminNav
          items={[
            { href: `/${locale}/admin`, label: dict.admin.dashboard },
            { href: `/${locale}/admin/ventas`, label: dict.admin.ventas },
            { href: `/${locale}/admin/scripts`, label: dict.admin.scripts },
            { href: `/${locale}/admin/publicaciones`, label: dict.admin.publicaciones },
            { href: `/${locale}/admin/clientes`, label: dict.admin.clientes },
          ]}
        />
        <div className="admin-sidebar-foot">
          <a href={`/${locale}`} className="btn-admin btn-admin--sm">
            {dict.admin.vista}
          </a>
          <LogoutButton label={dict.admin.salir} />
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
