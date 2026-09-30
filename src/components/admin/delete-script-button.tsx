'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteScriptButton({
  id,
  labels,
}: {
  id: string;
  labels: { eliminar: string; confirmar: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm(labels.confirmar)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/scripts/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      className="btn-admin btn-admin--danger btn-admin--sm"
      onClick={remove}
      disabled={busy}
    >
      {labels.eliminar}
    </button>
  );
}
