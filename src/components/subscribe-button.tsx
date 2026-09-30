'use client';

import { useState } from 'react';

/** Botón "avísame cuando salga": pide el correo y lo guarda en la lista. */
export function SubscribeButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  if (done) return <p className="sub-success">✓</p>;

  if (!open) {
    return (
      <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) setDone(true);
  }

  return (
    <form className="sub-form" onSubmit={submit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
      />
      <button type="submit" className="btn-primary">
        ✓
      </button>
    </form>
  );
}
