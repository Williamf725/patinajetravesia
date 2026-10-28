'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

function friendlyMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('plan actualizado')) return 'Tu plan se actualizó correctamente.';
  if (normalized.includes('comprobante subido')) return 'Comprobante subido correctamente. Quedó pendiente de revisión.';
  if (normalized.includes('cambios guardados')) return 'Los cambios se guardaron correctamente.';
  if (normalized.includes('asistencia guardada')) return 'La asistencia se guardó correctamente.';
  if (normalized.includes('copiado al portapapeles')) return 'Copiado al portapapeles.';
  if (normalized.includes('error al guardar asistencia')) return 'No se pudo guardar la asistencia. Inténtalo de nuevo.';
  if (normalized.includes('error al actualizar')) return 'No se pudo actualizar la información. Inténtalo de nuevo.';
  if (normalized.includes('error al eliminar')) return 'No se pudo eliminar. Inténtalo de nuevo.';
  if (normalized.includes('error al subir')) return 'No se pudo subir el archivo. Inténtalo de nuevo.';
  if (normalized.includes('error al guardar')) return 'No se pudieron guardar los cambios. Inténtalo de nuevo.';
  if (normalized.startsWith('error:') || normalized === 'error') return 'No se pudo completar la acción. Inténtalo de nuevo.';

  return message;
}

export default function NotificationBridge() {
  useEffect(() => {
    const nativeAlert = window.alert.bind(window);
    window.alert = (message?: unknown) => {
      const text = String(message ?? '');
      const isError = /error|no se pudo|fall/i.test(text);
      const content = friendlyMessage(text);

      if (isError) toast.error(content);
      else toast.success(content);
    };

    return () => {
      window.alert = nativeAlert;
    };
  }, []);

  return null;
}

