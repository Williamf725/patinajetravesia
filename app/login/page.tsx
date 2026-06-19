'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { login } from '@/app/auth/actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setError(null);
    setLoading(true);

    try {
      await login(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative pt-20">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grain pointer-events-none opacity-20" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md bg-[#131313] border-4 border-white p-8 md:p-12 shadow-brutal-lg z-10"
      >
        <div className="mb-10 text-center">
          <div className="bg-neon-green text-black font-mono text-[10px] font-bold px-2 py-0.5 inline-block mb-4">
            SISTEMA DE ACCESO
          </div>
          <h1 className="font-anton text-5xl md:text-6xl text-white uppercase leading-none tracking-tight">
            INICIAR <br /><span className="text-neon-green">SESIÓN</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">Email</label>
            <input
              name="email"
              type="email"
              required
              className="bg-transparent border-b-2 border-white/20 p-2 text-white focus:border-neon-green outline-none transition-all font-mono text-sm"
              placeholder="alumno@travesia.club"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">Key</label>
            <input
              name="password"
              type="password"
              required
              className="bg-transparent border-b-2 border-white/20 p-2 text-white focus:border-neon-green outline-none transition-all font-mono text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-hot-pink/10 border-l-4 border-hot-pink text-hot-pink font-mono text-[10px] uppercase">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="btn-tape w-full py-4 mt-4 text-xl tracking-widest font-anton disabled:opacity-50"
          >
            {loading ? 'VERIFICANDO...' : 'INGRESAR'}
          </button>
        </form>

        <div className="mt-8 text-center">
           <p className="font-mono text-[10px] text-white/40 uppercase">
             ¿AÚN NO TIENES CUENTA? <Link href="/registro" className="text-neon-green hover:underline">REGÍSTRATE AQUÍ</Link>
           </p>
        </div>
      </motion.div>
    </div>
  );
}
