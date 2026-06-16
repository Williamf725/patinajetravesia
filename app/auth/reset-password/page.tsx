'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updatePassword } from '@/app/auth/actions'
import { motion, AnimatePresence } from 'framer-motion'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    startTransition(async () => {
      const result = await updatePassword(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-black border-4 border-[#b8d300] p-8 shadow-[8px_8px_0px_0px_#ffb1c4]"
      >
        <h1 className="text-4xl font-black text-[#b8d300] uppercase italic mb-8 tracking-tighter">
          Nueva Contraseña
        </h1>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#b8d300] text-black p-4 font-bold text-center mb-6 border-2 border-black"
            >
              ¡CONTRASEÑA ACTUALIZADA!
              <p className="text-xs mt-2 font-mono uppercase">Redirigiendo al login...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[#ffb1c4] font-mono text-xs uppercase mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  disabled={isPending}
                  className="w-full bg-[#131313] border-2 border-[#ffb1c4] p-3 text-white focus:outline-none focus:border-[#b8d300] transition-colors font-mono"
                  placeholder="********"
                />
              </div>

              <div>
                <label className="block text-[#ffb1c4] font-mono text-xs uppercase mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  disabled={isPending}
                  className="w-full bg-[#131313] border-2 border-[#ffb1c4] p-3 text-white focus:outline-none focus:border-[#b8d300] transition-colors font-mono"
                  placeholder="********"
                />
              </div>

              {error && (
                <div className="bg-red-600 text-white p-3 text-xs font-mono uppercase border-2 border-black">
                  ERROR: {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full group relative"
              >
                <div className="absolute inset-0 bg-[#ffb1c4] translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform" />
                <div className="relative bg-[#b8d300] border-2 border-black p-4 text-black font-black uppercase italic text-xl group-active:scale-95 transition-transform flex justify-center items-center gap-2">
                  {isPending ? 'PROCESANDO...' : 'ACTUALIZAR'}
                  {!isPending && (
                    <div className="w-8 h-4 bg-black/20 absolute -top-2 -right-2 rotate-12" />
                  )}
                </div>
              </button>
            </form>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  )
}
