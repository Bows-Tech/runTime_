'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button type="button" className="btn-admin btn-admin--sm" onClick={logout}>
      {label}
    </button>
  );
}
