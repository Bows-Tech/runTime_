'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/i18n/config';

type Props = {
  scriptId: string;
  currentPath?: string | null;
  locale: Locale;
  labels: Record<string, string>;
};

/**
 * Sube el archivo del script al bucket privado y guarda la ruta.
 *
 * El archivo NO lo descarga el navegador después: la descarga se hace
 * siempre por /api/download/<token>, que valida el pago.
 */
export function FileUpload({ scriptId, currentPath, locale, labels }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState(currentPath ?? null);
  const [state, setState] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function upload(file: File) {
    setState('uploading');
    setError(null);
    setFileName(file.name);

    const body = new FormData();
    body.append('scriptId', scriptId);
    body.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const data = await res.json();

      if (!res.ok) {
        setState('error');
        setError(data.error || labels.error);
        return;
      }

      setPath(data.filePath);
      setState('idle');
      router.refresh();
    } catch {
      setState('error');
      setError(labels.error);
    }
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = '';
    setFileName(null);
    setPath(null);
  }

  return (
    <div className="upload-box">
      <div className="field">
        <span>{labels.archivo}</span>
        <input
          ref={inputRef}
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
          disabled={state === 'uploading'}
        />
      </div>

      {state === 'uploading' && <p className="upload-status">{labels.subiendo}…</p>}

      {error && <p className="form-error">{error}</p>}

      {path && (
        <div className="upload-ok">
          <span>✓ {labels.subido}</span>
          <code>{fileName ?? path.split('/').pop()}</code>
          <button
            type="button"
            className="btn-admin btn-admin--ghost btn-admin--sm"
            onClick={clear}
          >
            {labels.quitar}
          </button>
        </div>
      )}

      {!path && state === 'idle' && (
        <p className="upload-hint">{labels.sin_archivo}</p>
      )}
    </div>
  );
}
