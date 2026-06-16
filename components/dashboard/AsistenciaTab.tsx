'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { Plus, Save, Download } from 'lucide-react';
import { Alumno, Asistencia } from '@/types/database';

const DIAS_CLASE = {
  TODOS: 'Todos',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  SABADO: 'Sábado'
};

const DAY_INDICES: Record<number, string> = {
  3: 'Miércoles',
  4: 'Jueves',
  6: 'Sábado'
};

export default function AsistenciaTab() {
  const [loading, setLoading] = useState(true);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [asistencia, setAsistencia] = useState<Asistencia[]>([]);
  const [mes, setMes] = useState(new Date());
  const [filtroDia, setFiltroDia] = useState('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAlumno, setNewAlumno] = useState({ numero: '', nombre: '' });
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: alumnosData } = await supabase.from('alumnos').select('*').order('numero_alumno');
    const { data: asistenciaData } = await supabase.from('asistencia')
      .select('*')
      .gte('fecha', format(startOfMonth(mes), 'yyyy-MM-dd'))
      .lte('fecha', format(endOfMonth(mes), 'yyyy-MM-dd'));

    setAlumnos((alumnosData as Alumno[]) || []);
    setAsistencia((asistenciaData as Asistencia[]) || []);
    setLoading(false);
  }, [mes, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generar fechas del mes
  const fechasMes = useMemo(() => {
    const inicio = startOfMonth(mes);
    const fin = endOfMonth(mes);
    const todosLosDias = eachDayOfInterval({ start: inicio, end: fin });

    return todosLosDias.filter(dia => {
      const dayIdx = getDay(dia);
      if (filtroDia === 'Todos') return [3, 4, 6].includes(dayIdx);
      if (filtroDia === 'Miércoles') return dayIdx === 3;
      if (filtroDia === 'Jueves') return dayIdx === 4;
      if (filtroDia === 'Sábado') return dayIdx === 6;
      return false;
    });
  }, [mes, filtroDia]);

  const toggleAsistencia = (alumnoId: string, fecha: Date) => {
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    setAsistencia(prev => {
      const exists = prev.find(a => a.alumno_id === alumnoId && a.fecha === fechaStr);
      if (exists) {
        return prev.map(a => a.alumno_id === alumnoId && a.fecha === fechaStr
          ? { ...a, presente: !a.presente }
          : a);
      } else {
        return [...prev, { id: '', alumno_id: alumnoId, fecha: fechaStr, presente: true, created_at: '' }];
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('asistencia').upsert(
      asistencia.map(({ alumno_id, fecha, presente }) => ({
        alumno_id,
        fecha,
        presente
      })),
      { onConflict: 'alumno_id, fecha' }
    );

    if (error) alert('Error al guardar: ' + error.message);
    else alert('Cambios guardados con éxito');
    setIsSaving(false);
  };

  const handleAddAlumno = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('alumnos').insert({
      numero_alumno: parseInt(newAlumno.numero),
      nombre_completo: newAlumno.nombre
    });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setShowAddModal(false);
      setNewAlumno({ numero: '', nombre: '' });
      fetchData();
    }
  };

  const exportToExcel = () => {
    const data = alumnos.map(a => {
      const row: Record<string, string | number> = {
        'Nº Alumno': a.numero_alumno,
        'Nombre Completo': a.nombre_completo
      };
      fechasMes.forEach(f => {
        const fechaStr = format(f, 'yyyy-MM-dd');
        const asis = asistencia.find(asis => asis.alumno_id === a.id && asis.fecha === fechaStr);
        row[format(f, 'dd/MMM', { locale: es })] = asis?.presente ? '✓' : '';
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
    XLSX.writeFile(wb, `Asistencia_${format(mes, 'MMMM_yyyy', { locale: es })}.xlsx`);
  };

  if (loading) return <div>Cargando planilla...</div>;

  return (
    <div className="flex flex-col gap-6">

      {/* Top Filters */}
      <div className="flex flex-wrap items-center justify-between gap-6 bg-white/5 p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
           <button onClick={() => setMes(subMonths(mes, 1))} className="p-2 hover:bg-white/10 rounded">◀</button>
           <div className="text-center min-w-[150px]">
              <span className="block font-mono text-[10px] text-neon-green uppercase tracking-widest">Mes Seleccionado</span>
              <span className="font-anton text-2xl uppercase">{format(mes, 'MMMM yyyy', { locale: es })}</span>
           </div>
           <button onClick={() => setMes(addMonths(mes, 1))} className="p-2 hover:bg-white/10 rounded">▶</button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
             <label className="font-mono text-[10px] text-white/40 uppercase">Filtrar Día</label>
             <select
              value={filtroDia}
              onChange={(e) => setFiltroDia(e.target.value)}
              className="bg-black border border-white/20 p-2 text-sm font-mono outline-none focus:border-neon-green"
             >
               {Object.values(DIAS_CLASE).map(d => <option key={d} value={d}>{d}</option>)}
             </select>
          </div>

          <div className="flex gap-2 self-end">
            <button onClick={() => setShowAddModal(true)} className="btn-tape px-4 py-2 text-xs flex items-center gap-2">
              <Plus size={14} /> ALUMNO
            </button>
            <button onClick={exportToExcel} className="bg-white text-black px-4 py-2 text-xs font-bold hover:bg-neon-green transition-colors flex items-center gap-2">
              <Download size={14} /> EXCEL
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-neon-green text-black px-4 py-2 text-xs font-bold hover:brightness-110 flex items-center gap-2"
            >
              <Save size={14} /> {isSaving ? 'GUARDANDO...' : 'GUARDAR'}
            </button>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full border-collapse font-mono text-xs">
          <thead className="sticky top-0 z-20 bg-[#1a1a1a]">
            <tr className="border-b-2 border-white">
              <th className="p-3 text-left border-r border-white/20 w-16">Nº</th>
              <th className="p-3 text-left border-r border-white/20 min-w-[200px]">NOMBRE COMPLETO</th>
              {fechasMes.map((fecha, i) => (
                <th key={i} className="p-2 text-center border-r border-white/20 min-w-[70px]">
                  <span className="text-[10px] text-white/40 block">
                    {DAY_INDICES[getDay(fecha)]?.substring(0,3)}
                  </span>
                  {format(fecha, 'dd/MM')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno) => (
              <tr key={alumno.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="p-3 border-r border-white/20">{alumno.numero_alumno}</td>
                <td className="p-3 border-r border-white/20 font-bold uppercase">{alumno.nombre_completo}</td>
                {fechasMes.map((fecha, i) => {
                  const fechaStr = format(fecha, 'yyyy-MM-dd');
                  const isPresent = asistencia.find(a => a.alumno_id === alumno.id && a.fecha === fechaStr)?.presente;
                  return (
                    <td key={i} className="p-0 border-r border-white/20">
                      <button
                        onClick={() => toggleAsistencia(alumno.id, fecha)}
                        className={`w-full h-10 flex items-center justify-center transition-colors ${isPresent ? 'bg-neon-green/20 text-neon-green' : 'hover:bg-white/10'}`}
                      >
                        {isPresent ? '✓' : ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-[#131313] font-bold border-t-2 border-white">
             <tr>
               <td colSpan={2} className="p-3 text-right pr-6 uppercase tracking-widest text-white/40">Total Presentes:</td>
               {fechasMes.map((fecha, i) => {
                 const fechaStr = format(fecha, 'yyyy-MM-dd');
                 const total = asistencia.filter(a => a.fecha === fechaStr && a.presente).length;
                 return (
                   <td key={i} className="p-3 text-center text-neon-green bg-neon-green/5 border-r border-white/20">{total}</td>
                 );
               })}
             </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Alumno Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131313] border-4 border-white p-8 max-w-sm w-full shadow-brutal-lg">
            <h2 className="font-anton text-3xl uppercase mb-6">Nuevo Alumno</h2>
            <form onSubmit={handleAddAlumno} className="flex flex-col gap-4">
               <div className="flex flex-col gap-1">
                 <label className="font-mono text-[10px] text-neon-green uppercase tracking-widest">Nº Alumno</label>
                 <input
                  type="number"
                  required
                  value={newAlumno.numero}
                  onChange={e => setNewAlumno({...newAlumno, numero: e.target.value})}
                  className="bg-transparent border-b-2 border-white/20 p-2 outline-none focus:border-neon-green font-mono"
                 />
               </div>
               <div className="flex flex-col gap-1">
                 <label className="font-mono text-[10px] text-neon-green uppercase tracking-widest">Nombre Completo</label>
                 <input
                  type="text"
                  required
                  value={newAlumno.nombre}
                  onChange={e => setNewAlumno({...newAlumno, nombre: e.target.value})}
                  className="bg-transparent border-b-2 border-white/20 p-2 outline-none focus:border-neon-green font-mono uppercase"
                 />
               </div>
               <div className="flex gap-4 mt-4">
                 <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 border border-white/20 py-3 font-mono text-xs hover:bg-white/5">CANCELAR</button>
                 <button type="submit" className="flex-1 bg-neon-green text-black font-anton text-lg py-3 hover:brightness-110">AGREGAR</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
