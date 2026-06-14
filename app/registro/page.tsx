import { signup } from '@/app/auth/actions'
import Link from 'next/link'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const message = (await searchParams).message

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-[calc(100vh-80px)]">
      <form
        className="animate-in flex-1 flex flex-col w-full justify-center gap-6 text-foreground"
        action={signup}
      >
        <div className="bg-[#131313]/80 backdrop-blur-md p-8 border-4 border-hot-pink shadow-brutal-lg">
          <h1 className="font-anton text-5xl text-white uppercase mb-8 tracking-tight">
            NUEVO<br/>
            <span className="text-hot-pink">REGISTRO</span>
          </h1>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-hot-pink uppercase tracking-widest" htmlFor="name">
                Nombre Completo
              </label>
              <input
                className="bg-black border-2 border-white/20 p-3 text-white focus:border-hot-pink outline-none transition-colors font-mono"
                name="name"
                placeholder="Tu Nombre"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-hot-pink uppercase tracking-widest" htmlFor="email">
                Email
              </label>
              <input
                className="bg-black border-2 border-white/20 p-3 text-white focus:border-hot-pink outline-none transition-colors font-mono"
                name="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-hot-pink uppercase tracking-widest" htmlFor="password">
                Password
              </label>
              <input
                className="bg-black border-2 border-white/20 p-3 text-white focus:border-hot-pink outline-none transition-colors font-mono"
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-hot-pink uppercase tracking-widest" htmlFor="confirmPassword">
                Confirmar Password
              </label>
              <input
                className="bg-black border-2 border-white/20 p-3 text-white focus:border-hot-pink outline-none transition-colors font-mono"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                required
              />
            </div>

            <button className="btn-tape w-full py-4 mt-4 text-xl bg-hot-pink hover:bg-hot-pink/90">
              CREAR CUENTA
            </button>

            {message && (
              <p className={`mt-4 p-4 border-2 text-center font-mono text-sm uppercase ${
                message.includes('Check your email')
                  ? 'bg-neon-green/20 border-neon-green text-neon-green'
                  : 'bg-hot-pink/20 border-hot-pink text-hot-pink'
              }`}>
                {message}
              </p>
            )}

            <div className="mt-6 text-center">
              <p className="font-mono text-xs text-white/60 uppercase">
                ¿Ya tienes cuenta? {' '}
                <Link href="/login" className="text-hot-pink hover:underline">
                  INICIA SESIÓN
                </Link>
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
