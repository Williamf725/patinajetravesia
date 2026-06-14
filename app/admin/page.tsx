import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // En una app real, aquí verificarías si el user tiene rol de admin en tu DB

  return (
    <div className="flex-1 w-full flex flex-col gap-12 items-center px-6 md:px-20 py-20 min-h-screen">
      <div className="w-full max-w-6xl flex flex-col gap-8 bg-black p-10 border-8 border-hot-pink shadow-brutal-lg relative overflow-hidden">
        {/* Warning pattern */}
        <div className="absolute top-0 left-0 w-full h-4 bg-[repeating-linear-gradient(45deg,#ffb1c4,#ffb1c4_10px,#000_10px,#000_20px)]" />

        <h1 className="font-anton text-8xl text-hot-pink uppercase tracking-tighter mt-4">
          ADMIN<br/>
          <span className="text-white">CENTRAL</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="border-2 border-hot-pink p-4 flex flex-col gap-2">
            <span className="text-hot-pink font-bold">TOTAL USUARIOS</span>
            <span className="text-4xl text-white">1,284</span>
          </div>
          <div className="border-2 border-hot-pink p-4 flex flex-col gap-2">
            <span className="text-hot-pink font-bold">RECAUDO MES</span>
            <span className="text-4xl text-white">$4.2M</span>
          </div>
          <div className="border-2 border-hot-pink p-4 flex flex-col gap-2">
            <span className="text-hot-pink font-bold">REPORTES</span>
            <span className="text-4xl text-white">12</span>
          </div>
        </div>

        <div className="mt-8">
           <table className="w-full text-left font-mono text-sm border-collapse">
             <thead>
               <tr className="bg-hot-pink text-black uppercase">
                 <th className="p-2">Usuario</th>
                 <th className="p-2">Fecha</th>
                 <th className="p-2">Acción</th>
               </tr>
             </thead>
             <tbody className="text-white/80">
               <tr className="border-b border-white/10">
                 <td className="p-2">juan@travesia.com</td>
                 <td className="p-2">Hace 5m</td>
                 <td className="p-2 text-hot-pink">MODIFICAR</td>
               </tr>
               <tr className="border-b border-white/10">
                 <td className="p-2">maria_skate@gmail.com</td>
                 <td className="p-2">Hace 12m</td>
                 <td className="p-2 text-hot-pink">MODIFICAR</td>
               </tr>
             </tbody>
           </table>
        </div>
      </div>
    </div>
  )
}
