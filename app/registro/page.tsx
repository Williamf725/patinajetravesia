'use client';

import React, { useState, useActionState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { registrarAlumno } from '@/app/auth/actions';

export default function RegistroPage() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [state, formAction, isPending] = useActionState(registrarAlumno, null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Validaciones en el cliente
    const errors: Record<string, string> = {};
    const nombre = formData.get('nombre') as string;
    const apellido = formData.get('apellido') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) errors.email = 'Correo electrónico inválido';
    if (password.length < 6) errors.password = 'Mínimo 6 caracteres';
    if (!/\d/.test(password)) errors.password = 'Debe incluir al menos un número';
    if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';
    if (!nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!apellido.trim()) errors.apellido = 'El apellido es obligatorio';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    // Enviar al server action vía formAction
    // React maneja el estado isPending automáticamente con useActionState
    React.startTransition(() => {
      formAction(formData);
    });
  };

  // Mezclar errores de cliente y servidor
  const allFieldErrors = { ...fieldErrors };
  if (state?.field && state.error) {
    allFieldErrors[state.field] = state.error;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative pt-20">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grain pointer-events-none opacity-20" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg bg-[#131313] border-4 border-white p-8 md:p-12 shadow-brutal-lg z-10"
      >
        <div className="mb-10 text-center">
          <div className="bg-neon-green text-black font-mono text-[10px] font-bold px-2 py-0.5 inline-block mb-4">
            MEMBRESÍA CLUB TRAVESÍA
          </div>
          <h1 className="font-anton text-5xl md:text-6xl text-white uppercase leading-none tracking-tight">
            NUEVA <br /><span className="text-neon-green">CUENTA</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">Nombre</label>
              <input
                name="nombre"
                type="text"
                required
                className={`bg-transparent border-b-2 p-2 text-white outline-none transition-all font-mono text-sm ${allFieldErrors.nombre ? 'border-hot-pink' : 'border-white/20 focus:border-neon-green'}`}
                placeholder="EJ. JUAN"
              />
              {allFieldErrors.nombre && <span className="text-hot-pink font-mono text-[9px] uppercase tracking-tighter">{allFieldErrors.nombre}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">Apellido</label>
              <input
                name="apellido"
                type="text"
                required
                className={`bg-transparent border-b-2 p-2 text-white outline-none transition-all font-mono text-sm ${allFieldErrors.apellido ? 'border-hot-pink' : 'border-white/20 focus:border-neon-green'}`}
                placeholder="EJ. PÉREZ"
              />
              {allFieldErrors.apellido && <span className="text-hot-pink font-mono text-[9px] uppercase tracking-tighter">{allFieldErrors.apellido}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">Email</label>
            <input
              name="email"
              type="email"
              required
              className={`bg-transparent border-b-2 p-2 text-white outline-none transition-all font-mono text-sm ${allFieldErrors.email ? 'border-hot-pink' : 'border-white/20 focus:border-neon-green'}`}
              placeholder="alumno@travesia.club"
            />
            {allFieldErrors.email && (
              <div className="flex flex-col gap-1">
                <span className="text-hot-pink font-mono text-[9px] uppercase tracking-tighter">{allFieldErrors.email}</span>
                {state?.showLogin && (
                  <Link href="/login" className="text-neon-green font-mono text-[9px] uppercase underline">
                    Inicia sesión aquí
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">Key</label>
              <input
                name="password"
                type="password"
                required
                className={`bg-transparent border-b-2 p-2 text-white outline-none transition-all font-mono text-sm ${allFieldErrors.password ? 'border-hot-pink' : 'border-white/20 focus:border-neon-green'}`}
                placeholder="••••••••"
              />
              {allFieldErrors.password && <span className="text-hot-pink font-mono text-[9px] uppercase tracking-tighter">{allFieldErrors.password}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">Confirmar</label>
              <input
                name="confirmPassword"
                type="password"
                required
                className={`bg-transparent border-b-2 p-2 text-white outline-none transition-all font-mono text-sm ${allFieldErrors.confirmPassword ? 'border-hot-pink' : 'border-white/20 focus:border-neon-green'}`}
                placeholder="••••••••"
              />
              {allFieldErrors.confirmPassword && <span className="text-hot-pink font-mono text-[9px] uppercase tracking-tighter">{allFieldErrors.confirmPassword}</span>}
            </div>
          </div>

          {state?.error && state.field === 'general' && (
            <div className="p-3 bg-hot-pink/10 border-l-4 border-hot-pink text-hot-pink font-mono text-[10px] uppercase">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn-tape w-full py-4 mt-4 text-xl tracking-widest font-anton disabled:opacity-50"
          >
            {isPending ? 'PROCESANDO...' : 'UNIRSE AL CLUB'}
          </button>
        </form>

        <div className="mt-8 text-center">
           <p className="font-mono text-[10px] text-white/40 uppercase">
             ¿YA TIENES CUENTA? <Link href="/login" className="text-neon-green hover:underline">INGRESA AQUÍ</Link>
           </p>
        </div>
      </motion.div>
    </div>
  );
}
