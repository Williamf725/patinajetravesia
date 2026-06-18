'use client';

import React, { useState, useEffect } from 'react';
import { Alumno, Asistencia } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { Users, Filter } from 'lucide-react';

interface Props {
  alumnoAutenticadoId: string;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_CLASE = ['Miércoles', 'Jueves', 'Sábado'];

export default function MiAsistenciaTab({ alumnoAutenticadoId }: Props) {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [mesActual, setMesActual] = useState(MESES[new Date().getMonth()]);
  const [anioActual] = useState(new Date().getFullYear());
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: alumnosData } = await supabase.from('alumnos').select('*').order('numero_alumno', { ascending: true });
      const { data: asistenciaData } = await supabase.from('asistencia').select('*');

      if (alumnosData) setAlumnos(alumnosData);
      if (asistenciaData) setAsistencias(asistenciaData);
    };

    fetchData();
  }, [supabase]);

  // Logic to generate dates for columns (matching Dashboard logic)
  const getDatesInMonth = (monthName: string, year: number) => {
    const monthIndex = MESES.indexOf(monthName);
    const date = new Date(year, monthIndex, 1);
    const dates = [];
    while (date.getMonth() === monthIndex) {
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
      const dayCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      if (DIAS_CLASE.includes(dayCapitalized)) {
        dates.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  const dates = getDatesInMonth(mesActual, anioActual);

  const isPresent = (alumnoId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return asistencias.some(a => a.alumno_id === alumnoId && a.fecha === dateStr && a.presente);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <h2 className="font-anton text-3xl uppercase flex items-center gap-2">
          <Users className="text-neon-green" /> PLANILLA DE ASISTENCIA
        </h2>

        <div className="flex items-center gap-3 bg-[#1a1a1a] p-2 border-2 border-white shadow-brutal">
          <Filter size={16} className="text-neon-green" />
          <select
            value={mesActual}
            onChange={(e) => setMesActual(e.target.value)}
            className="bg-transparent font-mono text-xs uppercase text-white outline-none cursor-pointer"
          >
            {MESES.map(m => <option key={m} value={m} className="bg-[#131313]">{m}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border-4 border-white shadow-brutal overflow-x-auto">
        <table className="w-full font-mono text-[10px] uppercase tracking-tighter text-left border-collapse">
          <thead>
            <tr className="bg-black border-b-4 border-white">
              <th className="p-3 border-r border-white/20 sticky left-0 bg-black z-20 min-w-[200px]">Alumno</th>
              {dates.map((date, i) => (
                <th key={i} className="p-3 border-r border-white/20 text-center whitespace-nowrap min-w-[60px]">
                  {date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno) => (
              <tr
                key={alumno.id}
                className={`
                  border-b border-white/10 transition-colors
                  ${alumno.id === alumnoAutenticadoId ? 'bg-neon-green/10 border-l-8 border-l-neon-green' : 'hover:bg-white/5'}
                `}
              >
                <td className={`p-3 border-r border-white/20 sticky left-0 z-10 ${alumno.id === alumnoAutenticadoId ? 'bg-neon-green/10' : 'bg-[#1a1a1a]'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-neon-green font-bold">#{alumno.numero_alumno}</span>
                    <span className="font-anton text-sm truncate">{alumno.nombre_completo}</span>
                  </div>
                </td>
                {dates.map((date, i) => (
                  <td key={i} className="p-3 border-r border-white/20 text-center">
                    {isPresent(alumno.id, date) ? (
                      <span className="text-neon-green text-lg font-bold">●</span>
                    ) : (
                      <span className="text-white/10">○</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-2">
           <span className="text-neon-green text-lg font-bold">●</span>
           <span className="font-mono text-[10px] text-white/60 uppercase">Presente</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-white/10">○</span>
           <span className="font-mono text-[10px] text-white/60 uppercase">Ausente</span>
        </div>
      </div>
    </div>
  );
}
