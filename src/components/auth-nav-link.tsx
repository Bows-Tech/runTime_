'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Muestra "Iniciar sesión" para visitantes y un enlace al panel si la
 * sesión actual es de un administrador.
 */
export function AuthNavLink({
  href,
  label,
  locale,
}: {
  href: string;
  label: string;
  locale: string;
}) {  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!active) return;
        if (!user) {
          setIsAdmin(false);
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        if (active) setIsAdmin(profile?.is_admin === true);
      } catch {
        if (active) setIsAdmin(false);
      }
    }

    check();
    return () => {
      active = false;
    };
  }, []);

  // null = cargando; no renderizamos nada para evitar saltos de layout.
  if (isAdmin === null) return null;

  if (isAdmin) {
    return (
      <Link href={`/${locale}/admin`} className="icon-btn">
        admin
      </Link>
    );
  }

  return (
    <Link href={href} className="icon-btn">
      {label}
    </Link>
  );
}
