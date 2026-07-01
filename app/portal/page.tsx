import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAlumnoByEmail, getPlanes, getInscripcionActual, getHistorialInscripciones } from '@/app/auth/actions/portal';
import PortalClient from '@/components/portal/PortalClient';
import Link from 'next/link';

export default async function PortalPage() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  console.log('Portal Debug - User:', user?.email, 'Error:', error?.message);

  if (!user) {
    return redirect('/login');
  }

  const ADMIN_EMAIL = 'clubdepatinajetravesia@gmail.com';
  if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return redirect('/dashboard');
  }

  const alumno = await getAlumnoByEmail(user.email!);

  if (!alumno) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <div className="max-w-md w-full bg-[#131313] border-4 border-white p-8 shadow-brutal-lg text-center">
          <h1 className="font-anton text-4xl text-white uppercase mb-4">BIENVENIDO A <span className="text-neon-green">TRAVESÍA</span></h1>
          <p className="font-mono text-sm text-white/60 mb-8 uppercase">Parece que aún no tienes una ficha de alumno vinculada. Por favor regístrate para comenzar.</p>
          <Link href="/registro" className="btn-tape w-full py-4 block text-center font-anton text-xl tracking-widest">
            IR A REGISTRO
          </Link>
        </div>
      </div>
    );
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
