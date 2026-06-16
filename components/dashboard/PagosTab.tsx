'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';
import { Plus, Save, Download, Check, X } from 'lucide-react';
import { Alumno, Pago, Abono } from '@/types/database';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const ANIOS = [2024, 2025, 2026];

export default function PagosTab() {
  const [loading, setLoading] = useState(true);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [filtroMes, setFiltroMes] = useState(MESES[new Date().getMonth()]);
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: alumnosData } = await supabase.from('alumnos').select('*').order('numero_alumno');
    const { data: pagosData } = await supabase.from('pagos')
      .select('*')
      .eq('mes', filtroMes)
      .eq('anio', filtroAnio);

    setAlumnos((alumnosData as Alumno[]) || []);
    setPagos((pagosData as Pago[]) || []);
    setLoading(false);
  }, [filtroMes, filtroAnio, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updatePago = (alumnoId: string, field: string, value: string | number | boolean | Abono[]) => {
    setPagos(prev => {
      const exists = prev.find(p => p.alumno_id === alumnoId);
      if (exists) {
        return prev.map(p => p.alumno_id === alumnoId ? { ...p, [field]: value } : p);
      } else {
        return [...prev, {
          id: '',
          alumno_id: alumnoId,
          mes: filtroMes,
          anio: filtroAnio,
          clases_tomadas: 0,
          valor_por_clase: 0,
          pago_mensual: 0,
          pagado: false,
          abonos: [],
          observaciones: '',
          created_at: '',
          updated_at: '',
          [field]: value
        }] as Pago[];
      }
    });
  };

  const addAbono = (alumnoId: string) => {
    const monto = prompt('Monto del abono (COP):');
    if (!monto || isNaN(Number(monto))) return;

    const currentPago = pagos.find(p => p.alumno_id === alumnoId);
    const abonos = currentPago?.abonos || [];
    const nuevoAbono: Abono = {
      monto: Number(monto),
      fecha: new Date().toISOString()
    };

    updatePago(alumnoId, 'abonos', [...abonos, nuevoAbono]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('pagos').upsert(
      pagos.map(({ alumno_id, mes, anio, clases_tomadas, valor_por_clase, pago_mensual, pagado, abonos, observaciones }) => ({
        alumno_id,
        mes,
        anio,
        clases_tomadas,
        valor_por_clase,
        pago_mensual,
        pagado,
        abonos,
        observaciones
      })),
      { onConflict: 'alumno_id, mes, anio' }
    );

    if (error) alert('Error: ' + error.message);
    else alert('Pagos guardados');
    setIsSaving(false);
  };

  const calculateRow = (pago: Pago | undefined) => {
    const subtotal = (pago?.clases_tomadas || 0) * (pago?.valor_por_clase || 0);
    const mensual = pago?.pago_mensual || 0;
    const granTotal = subtotal + mensual;

    const totalAbonado = (pago?.abonos || []).reduce((acc: number, cur: Abono) => acc + cur.monto, 0);
    const saldo = granTotal - totalAbonado;

    const estado = pago?.pagado ? 'Pagado' : (totalAbonado > 0 ? 'Abono' : 'Pendiente');
    const color = pago?.pagado ? 'bg-neon-green/20 text-neon-green' : (totalAbonado > 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-hot-pink/20 text-hot-pink');

    return { subtotal, mensual, granTotal, totalAbonado, saldo, estado, color };
  };

  const filteredAlumnos = alumnos.filter(a => {
    if (filtroEstado === 'Todos') return true;
    const p = pagos.find(p => p.alumno_id === a.id);
    const { estado } = calculateRow(p);
    return estado === filtroEstado;
  });

  const exportExcel = () => {
    const data = filteredAlumnos.map(a => {
      const p = pagos.find(p => p.alumno_id === a.id);
      const calc = calculateRow(p);
      return {
        'Nº': a.numero_alumno,
        'Alumno': a.nombre_completo,
        'Mes': filtroMes,
        'Año': filtroAnio,
        'Clases': p?.clases_tomadas || 0,
        'Valor Clase': p?.valor_por_clase || 0,
        'Subtotal': calc.subtotal,
        'Total Abonado': calc.totalAbonado,
        'Saldo': calc.saldo,
        'Estado': calc.estado,
        'Obs': p?.observaciones || ''
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pagos');
    XLSX.writeFile(wb, `Pagos_${filtroMes}_${filtroAnio}.xlsx`);
  };

  if (loading) return <div>Cargando planilla de pagos...</div>;

  return (
    <div className="flex flex-col gap-6">

      {/* Filters Area */}
      <div className="flex flex-wrap items-end justify-between gap-6 bg-white/5 p-6 border-b border-white/10">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-white/40 uppercase">Mes</label>
            <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="bg-black border border-white/20 p-2 text-sm font-mono outline-none">
              {MESES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-white/40 uppercase">Año</label>
            <select value={filtroAnio} onChange={e => setFiltroAnio(Number(e.target.value))} className="bg-black border border-white/20 p-2 text-sm font-mono outline-none">
              {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-white/40 uppercase">Estado</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="bg-black border border-white/20 p-2 text-sm font-mono outline-none">
              <option value="Todos">Todos</option>
              <option value="Pagado">Pagado</option>
              <option value="Abono">Abono</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
           <button onClick={exportExcel} className="bg-white text-black px-4 py-2 text-xs font-bold hover:bg-neon-green transition-colors flex items-center gap-2">
              <Download size={14} /> EXCEL
           </button>
           <button onClick={handleSave} disabled={isSaving} className="bg-neon-green text-black px-4 py-2 text-xs font-bold hover:brightness-110 flex items-center gap-2">
              <Save size={14} /> {isSaving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
           </button>
        </div>
      </div>

      {/* Pagos Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[11px]">
          <thead>
            <tr className="bg-[#222] border-b-2 border-white text-white/40 uppercase tracking-tighter">
              <th className="p-3 text-left">Alumno</th>
              <th className="p-3 text-center">Clases</th>
              <th className="p-3 text-center">Valor Cl.</th>
              <th className="p-3 text-center">Subtotal</th>
              <th className="p-3 text-center">Pago Mens.</th>
              <th className="p-3 text-center">Gran Total</th>
              <th className="p-3 text-center">Abonos</th>
              <th className="p-3 text-center">Total Ab.</th>
              <th className="p-3 text-center">Saldo</th>
              <th className="p-3 text-center">¿PAGÓ?</th>
              <th className="p-3 text-left">Obs</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlumnos.map((alumno) => {
              const p = pagos.find(p => p.alumno_id === alumno.id);
              const { subtotal, granTotal, totalAbonado, saldo } = calculateRow(p);

              return (
                <tr key={alumno.id} className="border-b border-white/10 hover:bg-white/5 transition-all">
                  <td className="p-3">
                    <span className="text-[9px] text-white/20 block">#{alumno.numero_alumno}</span>
                    <span className="font-bold uppercase whitespace-nowrap">{alumno.nombre_completo}</span>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={p?.clases_tomadas || 0}
                      onChange={e => updatePago(alumno.id, 'clases_tomadas', Number(e.target.value))}
                      className="w-16 bg-white/5 border border-white/10 p-1 text-center outline-none focus:border-neon-green"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={p?.valor_por_clase || 0}
                      onChange={e => updatePago(alumno.id, 'valor_por_clase', Number(e.target.value))}
                      className="w-24 bg-white/5 border border-white/10 p-1 text-center outline-none focus:border-neon-green"
                    />
                  </td>
                  <td className="p-3 text-center font-bold">${subtotal.toLocaleString()}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={p?.pago_mensual || 0}
                      onChange={e => updatePago(alumno.id, 'pago_mensual', Number(e.target.value))}
                      className="w-24 bg-white/5 border border-white/10 p-1 text-center outline-none focus:border-neon-green"
                    />
                  </td>
                  <td className="p-3 text-center font-black bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => {
                        const confirmMsg = p?.pagado ? '¿Marcar como NO pagado?' : '¿Marcar como PAGADO TOTAL?';
                        if (confirm(confirmMsg)) {
                          updatePago(alumno.id, 'pagado', !p?.pagado);
                        }
                      }}>
                    <span className={p?.pagado ? 'text-neon-green' : 'text-white'}>
                      ${granTotal.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => addAbono(alumno.id)} className="p-1 hover:text-neon-green transition-colors">
                      <Plus size={16} />
                    </button>
                  </td>
                  <td className="p-3 text-center text-neon-green font-bold">${totalAbonado.toLocaleString()}</td>
                  <td className={`p-3 text-center font-black ${saldo > 0 ? 'text-hot-pink' : 'text-neon-green'}`}>
                    ${saldo.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => updatePago(alumno.id, 'pagado', !p?.pagado)}
                      className={`w-8 h-8 mx-auto flex items-center justify-center rounded border-2 transition-all ${p?.pagado ? 'bg-neon-green border-neon-green text-black' : 'border-white/20 text-white/20 hover:border-white'}`}
                    >
                      {p?.pagado ? <Check size={16} strokeWidth={4} /> : <X size={16} />}
                    </button>
                  </td>
                  <td className="p-3 min-w-[200px]">
                    <textarea
                      value={p?.observaciones || ''}
                      onChange={e => updatePago(alumno.id, 'observaciones', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-1 text-[9px] outline-none h-10 resize-none focus:border-neon-green"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
