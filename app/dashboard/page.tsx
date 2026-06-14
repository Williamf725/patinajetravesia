import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/auth/actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12 items-center px-6 md:px-20 py-20 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-8 bg-[#131313]/90 p-10 border-8 border-neon-green shadow-brutal-lg">
        <div className="flex justify-between items-start border-b-4 border-neon-green pb-6">
          <h1 className="font-anton text-6xl text-white uppercase tracking-tighter">
            PANEL DE<br/>
            <span className="text-neon-green">CONTROL</span>
          </h1>
          <form action={signOut}>
            <button className="btn-tape bg-hot-pink hover:bg-hot-pink/80 text-sm">
              CERRAR SESIÓN
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono">
          <div className="bg-black/50 p-6 border-2 border-white/10">
            <p className="text-neon-green text-xs uppercase mb-2">{/* // Perfil de Usuario */}</p>
            <p className="text-white text-xl">{user.email}</p>
            <p className="text-white/50 text-xs mt-2 uppercase">ID: {user.id}</p>
          </div>

          <div className="bg-black/50 p-6 border-2 border-white/10">
            <p className="text-neon-green text-xs uppercase mb-2">{/* // Estado de Membresía */}</p>
            <p className="text-white text-xl">ACTIVO — NIVEL URBANO</p>
            <p className="text-white/50 text-xs mt-2 uppercase">Expira: 31-12-2024</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 font-anton uppercase text-2xl">
          <div className="bg-white text-black p-4 flex justify-between items-center hover:translate-x-2 transition-transform cursor-pointer">
            <span>Ver mis entrenamientos</span>
            <span>→</span>
          </div>
          <div className="bg-white text-black p-4 flex justify-between items-center hover:translate-x-2 transition-transform cursor-pointer">
            <span>Próximas rutas nocturnas</span>
            <span>→</span>
          </div>
          <div className="bg-white text-black p-4 flex justify-between items-center hover:translate-x-2 transition-transform cursor-pointer">
            <span>Tienda oficial club</span>
            <span>→</span>
          </div>
        </div>
      </div>
    </div>
  )
}
