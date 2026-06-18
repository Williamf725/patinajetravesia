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
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-xl bg-[#131313] border-4 border-white p-10 shadow-brutal text-center space-y-8">
          <h1 className="font-anton text-5xl md:text-6xl text-white uppercase leading-none tracking-tight">
            TU CUENTA <br />
            <span className="text-neon-green">FUE CREADA</span>
          </h1>

          <div className="space-y-4">
            <p className="font-space text-lg text-white/80">
              El administrador debe vincularte como alumno antes de que puedas acceder.
            </p>
            <p className="font-space text-lg text-white/80 font-bold">
              Si ya eres alumno del club, escríbenos por WhatsApp para activar tu perfil.
            </p>
          </div>

          <a
            href="https://wa.me/573222508676?text=Hola,%20acabo%20de%20registrarme%20en%20el%20portal%20del%20Club%20Travesía%20con%20mi%20correo%20y%20quisiera%20que%20vinculen%20mi%20cuenta."
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tape w-full py-4 text-xl"
          >
            HABLAR POR WHATSAPP
          </a>
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
