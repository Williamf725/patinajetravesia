'use client';

import React, { useState, useEffect } from 'react';
import { Asistencia } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { CalendarRange, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  alumnoAutenticadoId: string;
}

const SCHEDULE_MAPPING: Record<string, string> = {
  'miércoles': '2:30 PM a 4:30 PM',
  'jueves': '6:30 PM a 8:30 PM',
  'sábado': '4:00 PM a 6:00 PM'
};

export default function MiAsistenciaTab({ alumnoAutenticadoId }: Props) {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'presente' | 'ausente'>('todos');
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('asistencia')
        .select('*')
        .eq('alumno_id', alumnoAutenticadoId)
        .order('fecha', { ascending: false });

      if (data) setAsistencias(data as Asistencia[]);
      setLoading(false);
    };

    fetchData();
  }, [supabase, alumnoAutenticadoId]);

  const filteredAsistencias = asistencias.filter(a => {
    if (filtroEstado === 'todos') return true;
    if (filtroEstado === 'presente') return a.presente;
    return !a.presente;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <h2 className="font-anton text-3xl uppercase flex items-center gap-2">
          <CalendarRange className="text-neon-green" /> MI ASISTENCIA
        </h2>

        <div className="flex items-center gap-3 bg-[#1a1a1a] p-2 border-2 border-white shadow-brutal">
          <Filter size={16} className="text-neon-green" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as 'todos' | 'presente' | 'ausente')}
            className="bg-transparent font-mono text-xs uppercase text-white outline-none cursor-pointer"
          >
            <option value="todos" className="bg-[#131313]">TODOS</option>
            <option value="presente" className="bg-[#131313]">PRESENTES</option>
            <option value="ausente" className="bg-[#131313]">AUSENCIAS</option>
          </select>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border-4 border-white shadow-brutal overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[10px] uppercase tracking-tighter text-left border-collapse">
            <thead>
              <tr className="bg-black border-b-4 border-white">
                <th className="p-4 border-r border-white/20">Fecha</th>
                <th className="p-4 border-r border-white/20">Día</th>
                <th className="p-4 border-r border-white/20">Horario</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center animate-pulse">Cargando historial...</td></tr>
              ) : filteredAsistencias.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-white/20">No se encontraron registros de asistencia</td></tr>
              ) : (
                filteredAsistencias.map((item) => {
                  const dateObj = parseISO(item.fecha);
                  const dayName = format(dateObj, 'EEEE', { locale: es }).toLowerCase();
                  const schedule = SCHEDULE_MAPPING[dayName] || 'No definido';

                  return (
                    <tr key={item.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="p-4 border-r border-white/20 font-bold">
                        {format(dateObj, 'dd/MM/yyyy')}
                      </td>
                      <td className="p-4 border-r border-white/20 italic">
                        {format(dateObj, 'EEEE', { locale: es })}
                      </td>
                      <td className="p-4 border-r border-white/20 text-white/60">
                        {schedule}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 font-bold ${item.presente ? 'text-neon-green bg-neon-green/10 border border-neon-green' : 'text-hot-pink bg-hot-pink/10 border border-hot-pink'}`}>
                          {item.presente ? 'PRESENTE' : 'AUSENTE'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && asistencias.length > 0 && (
        <div className="flex gap-6 mt-4 p-4 bg-white/5 border border-white/10">
           <div className="flex flex-col">
              <span className="text-[10px] text-white/40 uppercase">Total Sesiones</span>
              <span className="font-anton text-2xl">{asistencias.length}</span>
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] text-white/40 uppercase text-neon-green">Asistidas</span>
              <span className="font-anton text-2xl text-neon-green">{asistencias.filter(a => a.presente).length}</span>
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] text-white/40 uppercase text-hot-pink">Fallas</span>
              <span className="font-anton text-2xl text-hot-pink">{asistencias.filter(a => !a.presente).length}</span>
           </div>
        </div>
      )}
    </div>
  );
}
