'use client';

import React, { useState } from 'react';
import { Alumno } from '@/types/database';
import { guardarPerfil } from '@/app/auth/actions/perfil';
import { User, ShieldCheck, Save, Phone, Fingerprint } from 'lucide-react';

interface Props {
  alumno: Alumno;
}

export default function MiPerfilTab({ alumno }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await guardarPerfil(formData);
      if (result.success) {
        setMessage({ type: 'success', text: '✅ Perfil actualizado correctamente' });
        // Optionally reload to refresh the context data but keep the message visible for a bit
        setTimeout(() => window.location.reload(), 2000);
      } else if (result.error) {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
        <User className="text-neon-green" size={32} />
        <div>
          <h2 className="font-anton text-3xl uppercase leading-none">Mi Perfil</h2>
          <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Información de Identidad</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-[#1a1a1a] border-4 border-white p-8 shadow-brutal">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-neon-green uppercase tracking-widest font-bold">Nombre</label>
            <input
              name="nombre"
              type="text"
              defaultValue={alumno.nombre || ''}
              required
              className="w-full bg-black border-2 border-white/10 p-3 text-white focus:border-neon-green outline-none font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-neon-green uppercase tracking-widest font-bold">Apellido</label>
            <input
              name="apellido"
              type="text"
              defaultValue={alumno.apellido || ''}
              required
              className="w-full bg-black border-2 border-white/10 p-3 text-white focus:border-neon-green outline-none font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-mono text-[10px] text-white/40 uppercase tracking-widest font-bold">Email (Solo Lectura)</label>
          <input
            type="email"
            value={alumno.email || ''}
            readOnly
            className="w-full bg-black/40 border-2 border-white/5 p-3 text-white/40 outline-none font-mono text-sm cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-neon-green uppercase tracking-widest font-bold flex items-center gap-2">
              <ShieldCheck size={12} /> Tipo Documento
            </label>
            <select
              name="tipoDocumento"
              defaultValue={alumno.tipo_documento || ''}
              required
              className="w-full bg-black border-2 border-white/10 p-3 text-white focus:border-neon-green outline-none font-mono text-sm appearance-none"
            >
              <option value="">Selecciona un tipo</option>
              <option value="cedula_ciudadania">Cédula de Ciudadanía</option>
              <option value="tarjeta_identidad">Tarjeta de Identidad</option>
              <option value="pasaporte">Pasaporte</option>
              <option value="nit">NIT</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-neon-green uppercase tracking-widest font-bold flex items-center gap-2">
              <Fingerprint size={12} /> Nº Documento
            </label>
            <input
              name="numeroDocumento"
              type="text"
              defaultValue={alumno.numero_documento || ''}
              required
              className="w-full bg-black border-2 border-white/10 p-3 text-white focus:border-neon-green outline-none font-mono text-sm"
              placeholder="12345678"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-mono text-[10px] text-neon-green uppercase tracking-widest font-bold flex items-center gap-2">
            <Phone size={12} /> Nº Celular
          </label>
          <input
            name="telefono"
            type="text"
            defaultValue={alumno.telefono || ''}
            required
            className="w-full bg-black border-2 border-white/10 p-3 text-white focus:border-neon-green outline-none font-mono text-sm"
            placeholder="300 000 0000"
          />
        </div>

        <div className="space-y-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-tape w-full py-4 flex items-center justify-center gap-3 text-xl font-anton disabled:opacity-50"
          >
            <Save size={24} /> {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
          </button>

          {message && (
            <p
              className={`text-center font-mono text-xs uppercase font-bold py-2 px-4 border-2 ${
                message.type === 'success' ? 'text-[#00ff88] border-[#00ff88]/20 bg-[#00ff88]/5' : 'text-[#ff2d78] border-[#ff2d78]/20 bg-[#ff2d78]/5'
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
