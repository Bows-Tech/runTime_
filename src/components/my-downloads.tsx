'use client';

import { useState } from 'react';

type Token = {
  token: string;
  used: boolean;
  expires_at: string;
  scripts: { name: string; extension: string } | null;
};

export function MyDownloads({ labels }: { labels: Record<string, string> }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Token[] | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setTokens(null);
    try {
      const res = await fetch('/api/my-downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setTokens(data.tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <form className="sub-form" onSubmit={submit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {labels.ver}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      {tokens && tokens.length === 0 && <p className="cart-empty">{labels.vacio}</p>}

      {tokens && tokens.length > 0 && (
        <ul style={{ marginTop: 24, display: 'grid', gap: 10 }}>
          {tokens.map((t) => {
            const expired = new Date(t.expires_at).getTime() < Date.now();
            const dead = t.used || expired;
            return (
              <li key={t.token} className="cart-item">
                <div>
                  <strong>
                    {t.scripts?.name ?? '—'}
                    {t.scripts ? `.${t.scripts.extension}` : ''}
                  </strong>
                  <p>
                    {t.used
                      ? labels.usado
                      : expired
                        ? labels.expirado
                        : new Date(t.expires_at).toLocaleDateString()}
                  </p>
                </div>
                {dead ? (
                  <span className="ext">—</span>
                ) : (
                  <a className="buy" href={`/api/download/${t.token}`}>
                    {labels.descargar}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
