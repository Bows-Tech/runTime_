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

  // "Iniciar sesión" mide ~90px y en movil no cabia junto al selector de
  // idioma y el carrito: empujaba el boton de menu fuera de la pantalla,
  // dejando al usuario sin acceso a la navegacion. En movil solo se
  // muestra el icono; el texto sigue en el atributo title y aria-label.
  return (
    <Link
      href={href}
      className="icon-btn auth-nav"
      title={label}
      aria-label={label}
    >
      <span aria-hidden="true" className="auth-nav__full">
        {label}
      </span>
      <span aria-hidden="true" className="auth-nav__icon">
        &#128100;
      </span>
    </Link>
  );
}
