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
    const tipoDocumento = formData.get('tipoDocumento') as string;
    const numeroDocumento = formData.get('numeroDocumento') as string;
    const telefono = formData.get('telefono') as string;
    const dia = formData.get('dia') as string;
    const mes = formData.get('mes') as string;
    const anioNacimiento = formData.get('anioNacimiento') as string;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) errors.email = 'Correo electrónico inválido';
    if (password.length < 6) errors.password = 'Mínimo 6 caracteres';
    if (!/\d/.test(password)) errors.password = 'Debe incluir al menos un número';
    if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';
    if (!nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!apellido.trim()) errors.apellido = 'El apellido es obligatorio';

    if (!tipoDocumento) errors.tipoDocumento = 'Selecciona un tipo de documento';
    if (!numeroDocumento.trim()) errors.numeroDocumento = 'El número de documento es obligatorio';
    if (!/^\d{7,15}$/.test(numeroDocumento)) errors.numeroDocumento = 'Número de documento inválido';
    if (!/^\d{7,15}$/.test(telefono)) errors.telefono = 'Número de celular inválido';

    if (!dia || !mes || !anioNacimiento) {
      errors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
    } else {
      const fecha = new Date(parseInt(anioNacimiento), parseInt(mes) - 1, parseInt(dia));
      if (isNaN(fecha.getTime()) || fecha.getDate() !== parseInt(dia)) {
        errors.fechaNacimiento = 'La fecha de nacimiento no es válida';
      } else {
        const hoy = new Date();
        let edad = hoy.getFullYear() - fecha.getFullYear();
        const m = hoy.getMonth() - fecha.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) {
          edad--;
        }
        if (edad < 14) {
          errors.fechaNacimiento = 'Debes tener al menos 14 años';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    React.startTransition(() => {
      formAction(formData);
    });
  };

  const allFieldErrors = { ...fieldErrors };
  if (state?.field && state.error) {
    allFieldErrors[state.field] = state.error;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative pt-20">
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
              <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">Tipo Documento</label>
              <select
                name="tipoDocumento"
                required
                className={`bg-transparent border-b-2 p-2 text-white outline-none transition-all font-mono text-sm appearance-none ${allFieldErrors.tipoDocumento ? 'border-hot-pink' : 'border-white/20 focus:border-neon-green'}`}
              >
                <option value="" className="bg-black">Selecciona un tipo</option>
                <option value="cedula_ciudadania" className="bg-black">Cédula de Ciudadanía</option>
                <option value="tarjeta_identidad" className="bg-black">Tarjeta de Identidad</option>
                <option value="pasaporte" className="bg-black">Pasaporte</option>
                <option value="nit" className="bg-black">NIT</option>
              </select>
              {allFieldErrors.tipoDocumento && <span className="text-hot-pink font-mono text-[9px] uppercase tracking-tighter">{allFieldErrors.tipoDocumento}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">Nº Documento</label>
              <input
                name="numeroDocumento"
                type="text"
                required
                className={`bg-transparent border-b-2 p-2 text-white outline-none transition-all font-mono text-sm ${allFieldErrors.numeroDocumento ? 'border-hot-pink' : 'border-white/20 focus:border-neon-green'}`}
                placeholder="12345678"
              />
              {allFieldErrors.numeroDocumento && <span className="text-hot-pink font-mono text-[9px] uppercase tracking-tighter">{allFieldErrors.numeroDocumento}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">Celular</label>
            <input
              name="telefono"
              type="text"
              required
              className={`bg-transparent border-b-2 p-2 text-white outline-none transition-all font-mono text-sm ${allFieldErrors.telefono ? 'border-hot-pink' : 'border-white/20 focus:border-neon-green'}`}
              placeholder="300 000 0000"
            />
            {allFieldErrors.telefono && <span className="text-hot-pink font-mono text-[9px] uppercase tracking-tighter">{allFieldErrors.telefono}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">Fecha de Nacimiento</label>
            <div className="flex gap-2">
              <select
                name="dia"
                required
                className={`flex-1 bg-transparent border-b-2 p-2 text-white outline-none transition-all font-mono text-sm appearance-none ${allFieldErrors.fechaNacimiento ? 'border-hot-pink' : 'border-white/20 focus:border-neon-green'}`}
              >
                <option value="" className="bg-black">Día</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d} className="bg-black">{d}</option>
                ))}
              </select>

              <select
                name="mes"
                required
                className={`flex-2 bg-transparent border-b-2 p-2 text-white outline-none transition-all font-mono text-sm appearance-none ${allFieldErrors.fechaNacimiento ? 'border-hot-pink' : 'border-white/20 focus:border-neon-green'}`}
              >
                <option value="" className="bg-black">Mes</option>
                {[
                  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
                ].map((m, i) => (
                  <option key={i} value={i + 1} className="bg-black">{m}</option>
                ))}
              </select>

              <select
                name="anioNacimiento"
                required
                className={`flex-1 bg-transparent border-b-2 p-2 text-white outline-none transition-all font-mono text-sm appearance-none ${allFieldErrors.fechaNacimiento ? 'border-hot-pink' : 'border-white/20 focus:border-neon-green'}`}
              >
                <option value="" className="bg-black">Año</option>
                {Array.from(
                  { length: new Date().getFullYear() - 1924 },
                  (_, i) => new Date().getFullYear() - i
                ).map(a => (
                  <option key={a} value={a} className="bg-black">{a}</option>
                ))}
              </select>
            </div>
            {allFieldErrors.fechaNacimiento && <span className="text-hot-pink font-mono text-[9px] uppercase tracking-tighter">{allFieldErrors.fechaNacimiento}</span>}
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

          {/* Info inscripción y seguro */}
          <div style={{ background: '#111', border: '2px solid #00ff88', padding: '16px', marginBottom: '24px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784131243/seguro-mundial_phqk3p.png"
              style={{ height: '40px', marginBottom: '12px' }} alt="Seguro Mundial" />
            <p style={{ color: '#fff', fontSize: '14px', margin: '0 0 8px' }} className="font-space">
              {/* Info seguro registro */}
              Al unirte al club pagas una única vez $20.000 COP de inscripción que incluye tu póliza de seguro contra accidentes con Seguro Mundial vigente por 1 año.
            </p>
            <p style={{ color: '#00ff88', fontSize: '12px', margin: 0 }} className="font-mono">
              {/* Dato de pago */}
              Paga por Nequi a @SPA442 — A nombre de Silvia Peña
            </p>
          </div>

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
