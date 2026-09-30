'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';

type Props = {
  dict: Dictionary;
  locale: Locale;
};

const VACIO = {
  slug: '',
  titleEs: '',
  titleEn: '',
  subtitleEs: '',
  subtitleEn: '',
  eyebrow: '',
  badge: '',
  terminalTitle: '',
  terminalLines: '',
};

/**
 * Formulario de la publicación que alimenta la sección "próximo
 * lanzamiento" de la home.
 *
 * El título y el subtítulo tienen versión en español e inglés. Si dejas
 * la versión en inglés vacía, la página en inglés muestra la española, así
 * que publicar solo en español funciona sin dejar huecos.
 *
 * Las líneas de la terminal van en un solo textarea, una por línea.
 */
export function PublicationForm({ dict, locale }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ ...VACIO });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const es = locale === 'es';

  function set(key: keyof typeof VACIO, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch('/api/admin/publications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.titleEs,
        titleEn: form.titleEn,
        subtitle: form.subtitleEs,
        subtitleEn: form.subtitleEn,
        slug: form.slug,
        eyebrow: form.eyebrow,
        badge: form.badge,
        terminalTitle: form.terminalTitle,
        terminalLines: form.terminalLines
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
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

      <p className="upload-hint" style={{ marginTop: 0 }}>
        {es
          ? 'Esto reemplaza el bloque "próximo lanzamiento" de la portada. Solo se muestra la publicación más reciente.'
          : 'This replaces the "coming soon" block on the home page. Only the most recent publication is shown.'}
      </p>

      <label className="field">
        <span>{dict.admin.publicacion.titulo} (ES)</span>
        <input
          value={form.titleEs}
          onChange={(e) => set('titleEs', e.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>
          {dict.admin.publicacion.titulo} (EN){' '}
          <em style={{ opacity: 0.6 }}>{es ? 'opcional' : 'optional'}</em>
        </span>
        <input
          value={form.titleEn}
          onChange={(e) => set('titleEn', e.target.value)}
        />
      </label>

      <label className="field">
        <span>{dict.admin.script.descripcion} (ES)</span>
        <textarea
          rows={2}
          value={form.subtitleEs}
          onChange={(e) => set('subtitleEs', e.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>
          {dict.admin.script.descripcion} (EN){' '}
          <em style={{ opacity: 0.6 }}>{es ? 'opcional' : 'optional'}</em>
        </span>
        <textarea
          rows={2}
          value={form.subtitleEn}
          onChange={(e) => set('subtitleEn', e.target.value)}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>{dict.admin.script.slug}</span>
          <input
            value={form.slug}
            onChange={(e) => set('slug', slugify(e.target.value))}
            required
          />
        </label>
        <label className="field">
          <span>{es ? 'Etiqueta superior' : 'Top label'}</span>
          <input
            value={form.eyebrow}
            onChange={(e) => set('eyebrow', e.target.value)}
            placeholder={es ? 'próximo lanzamiento' : 'coming soon'}
          />
        </label>
        <label className="field">
          <span>{es ? 'Badge (ej: beta)' : 'Badge (e.g. beta)'}</span>
          <input value={form.badge} onChange={(e) => set('badge', e.target.value)} />
        </label>
      </div>

      <details>
        <summary className="admin-link" style={{ width: 'auto' }}>
          {es ? 'Personalizar la terminal' : 'Customise the terminal'}
        </summary>
        <div style={{ marginTop: 12, display: 'grid', gap: 14 }}>
          <label className="field">
            <span>{es ? 'Título de la terminal' : 'Terminal title'}</span>
            <input
              value={form.terminalTitle}
              onChange={(e) => set('terminalTitle', e.target.value)}
              placeholder={es ? 'devops-suite — preview' : 'devops-suite — preview'}
            />
          </label>
          <label className="field">
            <span>{es ? 'Líneas (una por línea)' : 'Lines (one per row)'}</span>
            <textarea
              rows={4}
              value={form.terminalLines}
              onChange={(e) => set('terminalLines', e.target.value)}
              placeholder={'deploy --canary 10%\nDesplegando canary release...'}
            />
          </label>
          <p className="upload-hint">
            {es
              ? 'Si lo dejas vacío se usan las líneas de ejemplo.'
              : 'Leave empty to use the sample lines.'}
          </p>
        </div>
      </details>

      {error && <p className="form-error">{error}</p>}

      <div className="admin-row-actions">
        <button type="submit" className="btn-admin btn-admin--primary" disabled={saving}>
          {dict.admin.script.guardar}
        </button>
        <a
          href={`/${locale}/admin/publicaciones`}
          className="btn-admin btn-admin--ghost btn-admin--sm"
        >
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