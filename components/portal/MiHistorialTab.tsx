'use client';

import React from 'react';
import { Inscripcion } from '@/types/database';
import { History, BadgeCheck, BadgeAlert, BadgeInfo } from 'lucide-react';

interface Props {
  historial: Inscripcion[];
}

export default function MiHistorialTab({ historial }: Props) {
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return <span className="bg-neon-green/20 text-neon-green border border-neon-green px-2 py-1 flex items-center gap-1"><BadgeCheck size={12} /> APROBADO</span>;
      case 'pendiente':
        return <span className="bg-yellow-400/20 text-yellow-400 border border-yellow-400 px-2 py-1 flex items-center gap-1"><BadgeInfo size={12} /> PENDIENTE</span>;
      case 'rechazado':
        return <span className="bg-hot-pink/20 text-hot-pink border border-hot-pink px-2 py-1 flex items-center gap-1"><BadgeAlert size={12} /> RECHAZADO</span>;
      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="font-anton text-3xl uppercase mb-6 flex items-center gap-2">
        <History className="text-neon-green" /> HISTORIAL DE PAGOS
      </h2>

      <div className="bg-[#1a1a1a] border-4 border-white shadow-brutal overflow-x-auto">
        <table className="w-full font-mono text-xs uppercase tracking-tighter text-left">
          <thead>
            <tr className="bg-black border-b-4 border-white">
              <th className="p-4 border-r border-white/20">Mes / Anio</th>
              <th className="p-4 border-r border-white/20">Plan</th>
              <th className="p-4 border-r border-white/20">Precio</th>
              <th className="p-4 border-r border-white/20 text-center">Clases (I/U/R)</th>
              <th className="p-4 border-r border-white/20">Estado</th>
              <th className="p-4">Fecha Inscripción</th>
            </tr>
          </thead>
          <tbody>
            {historial.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-white/20">
                  Aún no tienes inscripciones registradas
                </td>
              </tr>
            ) : (
              historial.map((item) => (
                <tr key={item.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4 border-r border-white/20 font-bold">
                    {item.mes} {item.anio}
                  </td>
                  <td className="p-4 border-r border-white/20">
                    {item.plan?.nombre}
                  </td>
                  <td className="p-4 border-r border-white/20">
                    ${item.plan?.precio.toLocaleString()}
                  </td>
                  <td className="p-4 border-r border-white/20 text-center font-mono">
                    {item.plan?.clases_incluidas} / {item.clases_usadas || 0} / {Math.max(0, (item.plan?.clases_incluidas || 0) - (item.clases_usadas || 0))}
                  </td>
                  <td className="p-4 border-r border-white/20">
                    {getStatusBadge(item.estado)}
                  </td>
                  <td className="p-4 text-white/40">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
