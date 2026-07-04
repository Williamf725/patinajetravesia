'use client';

import React, { useState } from 'react';
import { Alumno } from '@/types/database';
import { updatePerfil } from '@/app/auth/actions/perfil';
import { User, ShieldCheck, Save, Phone, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  alumno: Alumno;
}

export default function MiPerfilTab({ alumno }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await updatePerfil(formData);
      toast.success('✅ Perfil actualizado correctamente');
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar el perfil');
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
              name="tipo_documento"
              defaultValue={alumno.tipo_documento || ''}
              required
              className="w-full bg-black border-2 border-white/10 p-3 text-white focus:border-neon-green outline-none font-mono text-sm appearance-none"
            >
              <option value="">Seleccionar...</option>
              <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
              <option value="Tarjeta de Identidad">Tarjeta de Identidad</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="NIT">NIT</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-neon-green uppercase tracking-widest font-bold flex items-center gap-2">
              <Fingerprint size={12} /> Nº Documento
            </label>
            <input
              name="numero_documento"
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

        <button
          type="submit"
          disabled={loading}
          className="btn-tape w-full py-4 mt-4 flex items-center justify-center gap-3 text-xl font-anton disabled:opacity-50"
        >
          <Save size={24} /> {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
        </button>
      </form>
    </div>
  );
}
