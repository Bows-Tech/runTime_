'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';

type Props = {
  dict: Dictionary;
  locale: Locale;
  /** Categorías que ya existen en la tienda, para el desplegable. */
  categories?: string[];
  initial?: {
    id?: string;
    name: string;
    slug: string;
    extension: string;
    price: string;
    descriptionEs: string;
    descriptionEn: string;
    category: string;
  };
};

const NUEVA = '__nueva__';

const empty = {
  name: '',
  slug: '',
  extension: 'py',
  price: '',
  descriptionEs: '',
  descriptionEn: '',
  category: 'herramientas',
};

export function ScriptForm({ dict, locale, categories = [], initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ ...empty, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const es = locale === 'es';

  const isEdit = Boolean(initial?.id);

  // Al editar, la categoría del script puede no estar en la lista (si
  // se borró el último script que la usaba). Se añade para que el
  // desplegable no la pierda en silencio.
  const opciones = [...categories];
  if (form.category && !opciones.includes(form.category)) {
    opciones.push(form.category);
  }
  opciones.sort((a, b) => a.localeCompare(b));

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch(
      isEdit ? `/api/admin/scripts/${initial!.id}` : '/api/admin/scripts',
      {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          // El usuario escribe dólares; la base guarda centavos.
          priceCents: Math.round(parseFloat(form.price || '0') * 100),
        }),
      },
    );

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'Error al guardar');
      return;
    }

    // Al crear, llevamos a la pantalla de edición: es donde se sube el
    // archivo, y sin archivo el script no se puede vender.
    router.push(
      isEdit
        ? `/${locale}/admin/scripts`
        : `/${locale}/admin/scripts/${data.id}`,
    );
    router.refresh();
  }

  return (
    <form className="admin-card admin-form" onSubmit={submit}>
      <h3>{isEdit ? dict.admin.script.editar : dict.admin.script.crear}</h3>

      <label className="field">
        <span>{dict.admin.script.nombre}</span>
        <input value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </label>

      <label className="field">
        <span>{dict.admin.script.slug}</span>
        <input
          value={form.slug}
          onChange={(e) => set('slug', slugify(e.target.value))}
          required
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>ext</span>
          <input
            value={form.extension}
            onChange={(e) => set('extension', e.target.value.replace(/[^a-z0-9]/gi, ''))}
            required
          />
        </label>
        <label className="field">
          <span>{dict.admin.script.precio} (USD)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>{dict.admin.script.categoria}</span>
          <select
            value={form.category === NUEVA ? NUEVA : form.category}
            onChange={(e) => {
              const v = e.target.value;
              // Al elegir "nueva" se vacía el valor para que la caja de
              // texto de abajo sea la que manda, y no un marcador.
              set('category', v === NUEVA ? '' : v);
            }}
          >
            {opciones.length === 0 && <option value="">{es ? 'Sin categorías' : 'No categories'}</option>}
            {opciones.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NUEVA}>+ {es ? 'Nueva categoría' : 'New category'}</option>
          </select>
        </label>
      </div>

      {/* Solo aparece al pedir una categoría nueva. */}
      {!opciones.includes(form.category) && (
        <label className="field">
          <span>{es ? 'Nombre de la nueva categoría' : 'New category name'}</span>
          <input
            value={opciones.includes(form.category) ? '' : form.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder={es ? 'Ej: backups' : 'e.g. backups'}
            required
          />
        </label>
      )}

      <label className="field">
        <span>{dict.admin.script.descripcion} (ES)</span>
        <textarea
          rows={2}
          value={form.descriptionEs}
          onChange={(e) => set('descriptionEs', e.target.value)}
        />
      </label>

      <label className="field">
        <span>{dict.admin.script.descripcion} (EN)</span>
        <textarea
          rows={2}
          value={form.descriptionEn}
          onChange={(e) => set('descriptionEn', e.target.value)}
        />
      </label>

      {!isEdit && (
        <p className="upload-hint">
          {locale === 'es'
            ? 'Al guardar podrás subir el archivo del script. Sin archivo no podrá venderse.'
            : 'After saving you can upload the script file. Without a file it cannot be sold.'}
        </p>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="admin-row-actions">
        <button type="submit" className="btn-admin btn-admin--primary" disabled={saving}>
          {dict.admin.script.guardar}
        </button>
        <a href={`/${locale}/admin/scripts`} className="btn-admin btn-admin--ghost btn-admin--sm">
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
