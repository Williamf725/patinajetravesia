'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setLoading(false);

    if (resetError) {
      setError('No pudimos enviar el enlace. Inténtalo de nuevo en unos minutos.');
      return;
    }

    setSuccess(true);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-black p-6 pt-20">
      <div className="absolute inset-0 bg-grain pointer-events-none opacity-20" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-md border-4 border-white bg-[#131313] p-8 shadow-brutal-lg md:p-12"
      >
        <div className="mb-10 text-center">
          <div className="mb-4 inline-block bg-neon-green px-2 py-0.5 font-mono text-[10px] font-bold text-black">
            SISTEMA DE RECUPERACIÓN
          </div>
          <h1 className="font-anton text-5xl uppercase leading-none tracking-tight text-white md:text-6xl">
            RECUPERAR <br /><span className="text-neon-green">CUENTA</span>
          </h1>
        </div>

        {success ? (
          <div className="space-y-6 text-center">
            <p className="border-2 border-neon-green bg-neon-green/10 p-4 font-mono text-xs uppercase leading-relaxed text-white">
              Si tu correo está registrado, recibirás un enlace en los próximos minutos. Revisa también la carpeta de spam.
            </p>
            <Link href="/login" className="btn-tape block w-full py-4 text-center font-anton text-xl tracking-widest">
              VOLVER AL INGRESO
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-neon-green">
                Email registrado
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="border-b-2 border-white/20 bg-transparent p-2 font-mono text-sm text-white outline-none transition-all focus:border-neon-green"
                placeholder="alumno@travesia.club"
              />
            </div>

            {error && (
              <p role="alert" className="border-l-4 border-hot-pink bg-hot-pink/10 p-3 font-mono text-[10px] uppercase text-hot-pink">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-tape mt-4 w-full py-4 font-anton text-xl tracking-widest disabled:opacity-50"
            >
              {loading ? 'PROCESANDO...' : 'ENVIAR ENLACE'}
            </button>

            <div className="pt-2 text-center">
              <Link href="/login" className="font-mono text-[10px] uppercase text-white/40 hover:text-neon-green hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </main>
  );
}
