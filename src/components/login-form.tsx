'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = { labels: Record<string, string>; redirectTo: string; locale: string };

export function LoginForm({ labels, redirectTo, locale }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setError(authError?.message || labels.error);
      setLoading(false);
      return;
    }

    // Verificamos is_admin antes de dejar pasar: la ruta /admin también
    // lo comprueba en el servidor, esto solo evita un salto inútil.
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .single();

    if (profile?.is_admin !== true) {
      await supabase.auth.signOut();
      setError(labels.error);
      setLoading(false);
      return;
    }

    // `locale` viene sin slash inicial ("es"), así que sin el "/" de más
    // router.push haría una navegación relativa y landing en /es/es/admin
    // (404). El path se arma explícitamente.
    router.push(`/${locale}${redirectTo}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 14, maxWidth: 380 }}>
      <label className="field">
        <span>{labels.email}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>

      <label className="field">
        <span>{labels.password}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? '…' : labels.entrar}
      </button>
    </form>
  );
}
