import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAlumnoByEmail, getPlanes, getInscripcionActual, getHistorialInscripciones } from '@/app/auth/actions/portal';
import PortalClient from '@/components/portal/PortalClient';

export default async function PortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const ADMIN_EMAIL = 'clubdepatinajetravesia@gmail.com';
  if (user.email === ADMIN_EMAIL) {
    redirect('/dashboard');
  }

  const alumno = await getAlumnoByEmail(user.email!);

  if (!alumno) {
    redirect('/');
  }

  const [planes, inscripcionActual, historial] = await Promise.all([
    getPlanes(),
    getInscripcionActual(alumno.id),
    getHistorialInscripciones(alumno.id)
  ]);

  return (
    <PortalClient
      alumno={alumno}
      planes={planes}
      inscripcionActual={inscripcionActual}
      historial={historial}
    />
  );
}
