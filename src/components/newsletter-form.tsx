'use client';

import { useState } from 'react';
import type { Dictionary } from '@/i18n/dictionaries';

export function NewsletterForm({ dict }: { dict: Dictionary['contacto'] }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  async function handle(event: React.FormEvent) {
    event.preventDefault();
    setState('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? 'ok' : 'error');
      if (res.ok) setEmail('');
    } catch {
      setState('error');
    }
  }

  return (
    <>
      <form className="sub-form" onSubmit={handle}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={dict.email}
          required
        />
        <button type="submit" className="btn-primary" disabled={state === 'loading'}>
          {dict.suscribirme}
        </button>
      </form>
      {state === 'ok' && <p className="sub-success">{dict.exito}</p>}
      {state === 'error' && <p className="form-error">{dict.error}</p>}
    </>
  );
}
