'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';
import { Save, Download, Search } from 'lucide-react';
import { Alumno, Inscripcion, Plan } from '@/types/database';
import { savePagosChanges } from '@/app/auth/actions/admin';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const ANIOS = [2024, 2025, 2026];

export default function PagosTab() {
  const [loading, setLoading] = useState(true);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);

  const [filtroMes, setFiltroMes] = useState(MESES[new Date().getMonth()]);
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [search, setSearch] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: alumnosData } = await supabase.from('alumnos').select('*').order('numero_alumno');
    const { data: planesData } = await supabase.from('planes').select('*').order('precio', { ascending: true });
    const { data: inscData } = await supabase.from('inscripciones')
      .select('*, plan:planes(*)')
      .eq('mes', filtroMes)
      .eq('anio', filtroAnio);

    setAlumnos((alumnosData as Alumno[]) || []);
    setPlanes((planesData as Plan[]) || []);
    setInscripciones((inscData as Inscripcion[]) || []);
    setLoading(false);
  }, [filtroMes, filtroAnio, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateInscripcion = (alumnoId: string, field: string, value: string | number | null) => {
    setInscripciones(prev => {
      const exists = prev.find(i => i.alumno_id === alumnoId);
      if (exists) {
        return prev.map(i => {
          if (i.alumno_id === alumnoId) {
            const updated = { ...i, [field]: value };
            if (field === 'plan_id') {
              updated.plan = planes.find(p => p.id === value);
            }
            return updated;
          }
          return i;
        });
      } else {
        // Create a default skeleton for "Sin plan" students being edited
        const selectedPlan = field === 'plan_id' ? planes.find(p => p.id === value) : planes[0];
        return [...prev, {
          id: Math.random().toString(), // temp id
          alumno_id: alumnoId,
          plan_id: selectedPlan?.id || '',
          plan: selectedPlan,
          mes: filtroMes,
          anio: filtroAnio,
          clases_usadas: field === 'clases_usadas' ? (value as number) : 0,
          total_pagado: field === 'total_pagado' ? (value as number) : 0,
          estado: 'pendiente',
          observaciones: field === 'observaciones' ? (value as string) : '',
          fecha_aprobacion: null,
          created_at: new Date().toISOString()
        } as Inscripcion];
      }
    });
  };

  const handleSave = async () => {
    if (inscripciones.length === 0) return;
    setIsSaving(true);
    try {
      const dataToSave = inscripciones.map(i => {
        // Calculate status automatically based on payment
        const planPrice = i.plan?.precio || 0;
        let autoEstado = i.estado;
        if (i.total_pagado >= planPrice && planPrice > 0) autoEstado = 'aprobado';
        else if (i.total_pagado > 0) autoEstado = 'pendiente'; // Or could be a new 'abono' state if schema allowed

        return {
          alumno_id: i.alumno_id,
          plan_id: i.plan_id,
          mes: i.mes,
          anio: i.anio,
          clases_usadas: i.clases_usadas,
          total_pagado: i.total_pagado,
          estado: autoEstado,
          observaciones: i.observaciones
        };
      });

      await savePagosChanges(dataToSave);
      alert('Cambios guardados con éxito');
      fetchData();
    } catch (err) {
      alert('Error al guardar: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const getCalculatedState = (insc: Inscripcion | undefined) => {
    if (!insc || !insc.plan_id) return { label: 'Sin plan', color: 'text-white/20', saldo: 0 };

    const total = insc.plan?.precio || 0;
    const pagado = insc.total_pagado || 0;
    const saldo = total - pagado;

    if (pagado >= total && total > 0) return { label: 'Pagado', color: 'text-neon-green', saldo };
    if (pagado > 0) return { label: 'Abono', color: 'text-yellow-400', saldo };
    return { label: 'Pendiente', color: 'text-hot-pink', saldo };
  };

  const filteredAlumnos = alumnos.filter(a => {
    const insc = inscripciones.find(i => i.alumno_id === a.id);
    const { label } = getCalculatedState(insc);

    const matchesEstado = filtroEstado === 'Todos' || label === filtroEstado;
    const matchesSearch = a.nombre_completo.toLowerCase().includes(search.toLowerCase());

    return matchesEstado && matchesSearch;
  });

  const exportExcel = () => {
    const data = filteredAlumnos.map(a => {
      const insc = inscripciones.find(i => i.alumno_id === a.id);
      const { label, saldo } = getCalculatedState(insc);
      return {
        'Nº': a.numero_alumno,
        'Alumno': a.nombre_completo,
        'Email': a.email,
        'Plan': insc?.plan?.nombre || 'N/A',
        'Total a Pagar': insc?.plan?.precio || 0,
        'Total Pagado': insc?.total_pagado || 0,
        'Saldo': saldo,
        'Estado': label,
        'Obs': insc?.observaciones || ''
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pagos');
    XLSX.writeFile(wb, `Reporte_Pagos_${filtroMes}_${filtroAnio}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[#1a1a1a] p-6 border-4 border-white shadow-brutal">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] text-white/40 uppercase">Mes</label>
            <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="bg-black border border-white/20 p-2 text-xs font-mono outline-none uppercase">
              {MESES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] text-white/40 uppercase">Anio</label>
            <select value={filtroAnio} onChange={e => setFiltroAnio(Number(e.target.value))} className="bg-black border border-white/20 p-2 text-xs font-mono outline-none">
              {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] text-white/40 uppercase">Estado</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="bg-black border border-white/20 p-2 text-xs font-mono outline-none">
              <option value="Todos">TODOS</option>
              <option value="Pagado">PAGADO</option>
              <option value="Abono">ABONO</option>
              <option value="Pendiente">PENDIENTE</option>
              <option value="Sin plan">SIN PLAN</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[200px]">
             <label className="font-mono text-[9px] text-white/40 uppercase">Buscar</label>
             <div className="flex items-center gap-2 bg-black border border-white/20 p-2">
                <Search size={14} className="text-white/20" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="NOMBRE..."
                  className="bg-transparent outline-none text-xs font-mono uppercase w-full"
                />
             </div>
          </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
           <button onClick={exportExcel} className="flex-1 lg:flex-none bg-white text-black px-6 py-3 text-xs font-bold hover:bg-neon-green transition-colors flex items-center justify-center gap-2">
              <Download size={14} /> EXCEL
           </button>
           <button onClick={handleSave} disabled={isSaving || loading} className="flex-1 lg:flex-none bg-neon-green text-black px-6 py-3 text-xs font-bold hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50">
              <Save size={14} /> {isSaving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
           </button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-[#1a1a1a] border-4 border-white shadow-brutal overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[10px] uppercase">
          <thead>
            <tr className="bg-black border-b-4 border-white text-white/60">
              <th className="p-3 text-left border-r border-white/10">Alumno</th>
              <th className="p-3 text-left border-r border-white/10">Plan</th>
              <th className="p-3 text-center border-r border-white/10">Incluidas</th>
              <th className="p-3 text-center border-r border-white/10">Usadas</th>
              <th className="p-3 text-center border-r border-white/10">Total</th>
              <th className="p-3 text-center border-r border-white/10">Pagado</th>
              <th className="p-3 text-center border-r border-white/10">Saldo</th>
              <th className="p-3 text-center border-r border-white/10">Estado</th>
              <th className="p-3 text-left">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-20 text-center animate-pulse text-xl font-anton">Cargando datos financieros...</td></tr>
            ) : filteredAlumnos.length === 0 ? (
              <tr><td colSpan={9} className="p-10 text-center text-white/20">No se encontraron registros</td></tr>
            ) : (
              filteredAlumnos.map((alumno) => {
                const insc = inscripciones.find(i => i.alumno_id === alumno.id);
                const { label, color, saldo } = getCalculatedState(insc);

                return (
                  <tr key={alumno.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-3 border-r border-white/10 min-w-[180px]">
                      <span className="text-neon-green font-bold">#{alumno.numero_alumno}</span>
                      <p className="font-anton text-sm leading-none mt-1">{alumno.nombre_completo}</p>
                      <p className="text-[8px] text-white/40 truncate">{alumno.email}</p>
                    </td>
                    <td className="p-3 border-r border-white/10 min-w-[150px]">
                      <select
                        value={insc?.plan_id || ''}
                        onChange={e => updateInscripcion(alumno.id, 'plan_id', e.target.value)}
                        className="bg-black/40 border border-white/10 p-1 w-full outline-none focus:border-neon-green"
                      >
                        <option value="">SIN PLAN</option>
                        {planes.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre} (${p.precio.toLocaleString()})</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-center border-r border-white/10 font-bold text-white/40">
                      {insc?.plan?.clases_incluidas || 0}
                    </td>
                    <td className="p-3 text-center border-r border-white/10">
                      <input
                        type="number"
                        value={insc?.clases_usadas || 0}
                        onChange={e => updateInscripcion(alumno.id, 'clases_usadas', Number(e.target.value))}
                        className="w-12 bg-transparent border-b border-white/10 text-center outline-none focus:border-neon-green"
                      />
                    </td>
                    <td className="p-3 text-center border-r border-white/10 font-anton text-white/60">
                      ${(insc?.plan?.precio || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-center border-r border-white/10">
                      <input
                        type="number"
                        value={insc?.total_pagado || 0}
                        onChange={e => updateInscripcion(alumno.id, 'total_pagado', Number(e.target.value))}
                        className="w-20 bg-neon-green/5 border-b border-neon-green/20 text-center outline-none focus:text-neon-green font-bold"
                      />
                    </td>
                    <td className={`p-3 text-center border-r border-white/10 font-black ${saldo > 0 ? 'text-hot-pink' : 'text-neon-green'}`}>
                      ${saldo.toLocaleString()}
                    </td>
                    <td className={`p-3 text-center border-r border-white/10 font-anton ${color}`}>
                      {label}
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={insc?.observaciones || ''}
                        onChange={e => updateInscripcion(alumno.id, 'observaciones', e.target.value)}
                        placeholder="..."
                        className="w-full bg-transparent outline-none text-[9px] focus:placeholder-transparent"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
