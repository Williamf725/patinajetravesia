'use client';

import React, { useActionState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cambiarContrasena } from '@/app/auth/actions/nueva-contrasena';

function InputsFormulario() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  return (
    <>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />
    </>
  );
}

export default function NuevaContrasenaPage() {
  const [state, formAction, isPending] = useActionState(cambiarContrasena, null);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative pt-20">
      <div className="absolute inset-0 bg-grain pointer-events-none opacity-20" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md bg-[#131313] border-4 border-white p-8 md:p-12 shadow-brutal-lg z-10"
      >
        <div className="mb-10 text-center">
          <div className="bg-neon-green text-black font-mono text-[10px] font-bold px-2 py-0.5 inline-block mb-4">
            RESTABLECER CONTRASEÑA
          </div>
          <h1 className="font-anton text-5xl md:text-6xl text-white uppercase leading-none tracking-tight">
            NUEVA <br /><span className="text-neon-green">KEY</span>
          </h1>
        </div>

        {state?.success ? (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-neon-green/10 border-2 border-neon-green text-white font-mono text-xs uppercase leading-relaxed">
              ✅ Contraseña actualizada. Ahora puedes iniciar sesión.
            </div>
            <Link
              href="/login"
              className="btn-tape block w-full py-4 text-center text-xl tracking-widest font-anton text-decoration-none"
            >
              INICIAR SESIÓN
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-6">
            <Suspense fallback={null}>
              <InputsFormulario />
            </Suspense>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">
                Nueva Contraseña
              </label>
              <input
                name="password"
                type="password"
                required
                className="bg-transparent border-b-2 border-white/20 p-2 text-white focus:border-neon-green outline-none transition-all font-mono text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">
                Confirmar Contraseña
              </label>
              <input
                name="confirmar"
                type="password"
                required
                className="bg-transparent border-b-2 border-white/20 p-2 text-white focus:border-neon-green outline-none transition-all font-mono text-sm"
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <div className="p-3 bg-hot-pink/10 border-l-4 border-hot-pink text-hot-pink font-mono text-[10px] uppercase">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-tape w-full py-4 mt-4 text-xl tracking-widest font-anton disabled:opacity-50"
            >
              {isPending ? 'PROCESANDO...' : 'CAMBIAR CONTRASEÑA'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
