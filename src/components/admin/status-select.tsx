'use client';

import { useState } from 'react';

type Props = {
  id: string;
  value: string;
  labels: Record<string, string>;
  /** Ruta del endpoint PATCH. Por defecto, scripts. */
  endpoint?: string;
};

/** Cambia el estado (borrador/publicado/archivado) sin recargar. */
export function StatusSelect({ id, value, labels, endpoint = '/api/admin/scripts' }: Props) {
  const [status, setStatus] = useState(value);
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    const previous = status;
    setStatus(next);
    setSaving(true);

    const res = await fetch(`${endpoint}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });

    setSaving(false);
    if (!res.ok) setStatus(previous);
  }

  return (
    <select
      value={status}
      onChange={(e) => change(e.target.value)}
      disabled={saving}
      className="admin-select"
    >
      <option value="borrador">{labels.borrador}</option>
      <option value="publicado">{labels.publicado}</option>
      <option value="archivado">{labels.archivado}</option>
    </select>
  );
}
