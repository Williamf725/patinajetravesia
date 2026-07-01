'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a session (Supabase should have set it via the callback)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Sesión no válida o expirada. Por favor solicita un nuevo enlace.')
        router.push('/')
      }
    }
    checkSession()
  }, [router, supabase.auth])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast.success('Contraseña actualizada correctamente')
      router.push('/')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-black border-2 border-[#b8d300] p-8 shadow-[8px_8px_0px_0px_#b8d300]"
      >
        <h1 className="text-4xl font-black text-white mb-6 uppercase italic">
          Nueva <span className="text-[#b8d300]">Contraseña</span>
        </h1>

        <form onSubmit={handleReset} className="space-y-6">
          <div>
            <label className="block text-xs font-mono text-[#b8d300] mb-1 uppercase tracking-wider">
              Nueva Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#131313] border-2 border-white p-3 text-white focus:border-[#ffb1c4] outline-none transition-colors"
              placeholder="••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#b8d300] mb-1 uppercase tracking-wider">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#131313] border-2 border-white p-3 text-white focus:border-[#ffb1c4] outline-none transition-colors"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#b8d300] text-black font-black py-4 uppercase italic hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? 'ACTUALIZANDO...' : 'RESETEAR CONTRASEÑA'}
          </button>
        </form>
      </motion.div>
    </main>
  )
}
