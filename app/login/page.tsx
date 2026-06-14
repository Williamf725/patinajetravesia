import { login } from '@/app/auth/actions'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const message = (await searchParams).message

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-[calc(100vh-80px)]">
      <form
        className="animate-in flex-1 flex flex-col w-full justify-center gap-6 text-foreground"
        action={login}
      >
        <div className="bg-[#131313]/80 backdrop-blur-md p-8 border-4 border-neon-green shadow-brutal-lg">
          <h1 className="font-anton text-5xl text-white uppercase mb-8 tracking-tight">
            ACCESO<br/>
            <span className="text-neon-green">PATINADORES</span>
          </h1>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-neon-green uppercase tracking-widest" htmlFor="email">
                Email
              </label>
              <input
                className="bg-black border-2 border-white/20 p-3 text-white focus:border-neon-green outline-none transition-colors font-mono"
                name="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="font-mono text-xs text-neon-green uppercase tracking-widest" htmlFor="password">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="font-mono text-[10px] text-white/50 hover:text-neon-green uppercase"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                className="bg-black border-2 border-white/20 p-3 text-white focus:border-neon-green outline-none transition-colors font-mono"
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />
            </div>

            <button className="btn-tape w-full py-4 mt-4 text-xl">
              INGRESAR
            </button>

            {message && (
              <p className="mt-4 p-4 bg-hot-pink/20 border-2 border-hot-pink text-hot-pink text-center font-mono text-sm uppercase">
                {message}
              </p>
            )}

            <div className="mt-6 text-center">
              <p className="font-mono text-xs text-white/60 uppercase">
                ¿No tienes cuenta? {' '}
                <Link href="/registro" className="text-neon-green hover:underline">
                  REGÍSTRATE AQUÍ
                </Link>
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
