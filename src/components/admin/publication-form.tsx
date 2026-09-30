'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';

export function PublicationForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', slug: '', body: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch('/api/admin/publications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        slug: form.slug,
        body: { es: form.body, en: form.body },
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Error');
      return;
    }

    router.push(`/${locale}/admin/publicaciones`);
    router.refresh();
  }

  return (
    <form className="admin-card admin-form" onSubmit={submit}>
      <h3>{dict.admin.publicacion.crear}</h3>

      <label className="field">
        <span>{dict.admin.publicacion.titulo}</span>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </label>

      <label className="field">
        <span>{dict.admin.script.slug}</span>
        <input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
          required
        />
      </label>

      <label className="field">
        <span>{dict.admin.script.descripcion}</span>
        <textarea
          rows={6}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="admin-row-actions">
        <button type="submit" className="btn-admin btn-admin--primary" disabled={saving}>
          {dict.admin.script.guardar}
        </button>
        <a href={`/${locale}/admin/publicaciones`} className="btn-admin btn-admin--ghost btn-admin--sm">
          {dict.admin.script.cancelar}
        </a>
      </div>
    </form>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
