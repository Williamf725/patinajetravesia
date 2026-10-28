'use client';

import { useEffect, useRef } from 'react';

interface BaseDialogProps {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  busy?: boolean;
}

function useDialogKeyboard(onCancel: () => void, busy = false) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);
  const busyRef = useRef(busy);
  onCancelRef.current = onCancel;
  busyRef.current = busy;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>('button, input, [tabindex="0"]');
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) onCancelRef.current();
      if (event.key !== 'Tab' || !focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  return panelRef;
}

const overlayClass = 'fixed inset-0 z-[1200] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm';
const panelClass = 'w-full max-w-md border-4 border-white bg-[#131313] p-8 shadow-brutal-lg';
const cancelClass = 'flex-1 border border-white/20 px-4 py-3 font-mono text-xs text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon-green disabled:opacity-50';
const confirmClass = 'flex-1 bg-hot-pink px-4 py-3 font-anton text-lg text-white transition-colors hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50';

export function ConfirmDialog({
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel = 'ELIMINAR',
  busy = false,
}: BaseDialogProps) {
  const panelRef = useDialogKeyboard(onCancel, busy);

  return (
    <div className={overlayClass} onClick={() => !busy && onCancel()}>
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className={panelClass}
        onClick={event => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="mb-3 font-anton text-3xl uppercase text-white">{title}</h2>
        <p id="confirm-dialog-description" className="mb-8 font-mono text-sm leading-relaxed text-white/60">{description}</p>
        <div className="flex gap-4">
          <button type="button" onClick={onCancel} disabled={busy} className={cancelClass}>CANCELAR</button>
          <button type="button" onClick={onConfirm} disabled={busy} className={confirmClass}>
            {busy ? 'PROCESANDO...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface NameDialogProps extends Omit<BaseDialogProps, 'description' | 'confirmLabel'> {
  value: string;
  onChange: (value: string) => void;
}

export function NameDialog({ title, value, onChange, onCancel, onConfirm }: NameDialogProps) {
  const panelRef = useDialogKeyboard(onCancel);

  return (
    <div className={overlayClass} onClick={onCancel}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-dialog-title"
        className={panelClass}
        onClick={event => event.stopPropagation()}
      >
        <h2 id="name-dialog-title" className="mb-6 font-anton text-3xl uppercase text-white">{title}</h2>
        <form onSubmit={event => { event.preventDefault(); onConfirm(); }}>
          <label htmlFor="nombre-completo" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-neon-green">
            Nuevo nombre completo
          </label>
          <input
            id="nombre-completo"
            value={value}
            onChange={event => onChange(event.target.value)}
            required
            maxLength={120}
            className="mb-8 w-full border-b-2 border-white/20 bg-transparent p-3 font-mono text-sm text-white outline-none transition-colors focus:border-neon-green"
          />
          <div className="flex gap-4">
            <button type="button" onClick={onCancel} className={cancelClass}>CANCELAR</button>
            <button type="submit" className="flex-1 bg-neon-green px-4 py-3 font-anton text-lg text-black transition-colors hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              GUARDAR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

