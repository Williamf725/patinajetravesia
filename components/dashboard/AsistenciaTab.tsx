'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { vincularNFC, desvincularNFC } from '@/app/auth/actions/nfc';
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
import { Plus, Save, Download, Trash2, ShieldCheck, Fingerprint, Phone, User as UserIcon } from 'lucide-react';
import { Alumno, Asistencia, Inscripcion, Plan } from '@/types/database';

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

// Extended type for modal
type AlumnoConInscripcion = Alumno & {
    inscripciones?: (Inscripcion & { plan: Plan | null })[];
};

export default function AsistenciaTab() {
  const [loading, setLoading] = useState(true);
  const [alumnos, setAlumnos] = useState<AlumnoConInscripcion[]>([]);
  const [asistencia, setAsistencia] = useState<Asistencia[]>([]);
  const [mes, setMes] = useState(new Date());
  const [filtroDia, setFiltroDia] = useState('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAlumno, setNewAlumno] = useState({ nombre: '', apellido: '', email: '', tipo_documento: '', numero_documento: '', telefono: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [alumnoModal, setAlumnoModal] = useState<AlumnoConInscripcion | null>(null);

  // NFC Management States
  const [alumnoParaVincular, setAlumnoParaVincular] = useState<string>('');
  const [leyendoNFC, setLeyendoNFC] = useState<boolean>(false);
  const [mensajeVinculacion, setMensajeVinculacion] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: alumnosData } = await supabase
        .from('alumnos')
        .select('*, inscripciones(*, plan:planes(*))')
        .order('numero_alumno');

    const { data: asistenciaData } = await supabase.from('asistencia')
      .select('*')
      .gte('fecha', format(startOfMonth(mes), 'yyyy-MM-dd'))
      .lte('fecha', format(endOfMonth(mes), 'yyyy-MM-dd'));

    setAlumnos((alumnosData as AlumnoConInscripcion[]) || []);
    setAsistencia((asistenciaData as Asistencia[]) || []);
    setLoading(false);
  }, [mes, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

    if (error) alert('Error al guardar asistencia: ' + error.message);
    else alert('Asistencia guardada con éxito');
    setIsSaving(false);
  };

  const handleUpdateAlumno = async (alumnoId: string, updates: Partial<Alumno>) => {
    const { error } = await supabase.from('alumnos').update({
        ...updates,
        nombre_completo: (updates.nombre || updates.apellido)
            ? `${updates.nombre || alumnos.find(a => a.id === alumnoId)?.nombre} ${updates.apellido || alumnos.find(a => a.id === alumnoId)?.apellido}`
            : undefined
    }).eq('id', alumnoId);

    if (error) {
        alert('Error al actualizar: ' + error.message);
    } else {
        fetchData();
    }
  };

  const handleAddAlumno = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('alumnos').insert({
      nombre: newAlumno.nombre,
      apellido: newAlumno.apellido,
      nombre_completo: `${newAlumno.nombre} ${newAlumno.apellido}`,
      email: newAlumno.email,
      tipo_documento: newAlumno.tipo_documento,
      numero_documento: newAlumno.numero_documento,
      telefono: newAlumno.telefono,
      perfil_completo: !!(newAlumno.tipo_documento && newAlumno.numero_documento && newAlumno.telefono)
    });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setShowAddModal(false);
      setNewAlumno({ nombre: '', apellido: '', email: '', tipo_documento: '', numero_documento: '', telefono: '' });
      fetchData();
    }
  };

  const handleDeleteAlumno = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${nombre}? Esta acción no se puede deshacer.`)) {
      const { error } = await supabase.from('alumnos').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar: ' + error.message);
      } else {
        fetchData();
      }
    }
  };

  const leerNFCParaVincular = async () => {
    if (!alumnoParaVincular) return;
    setLeyendoNFC(true);
    setMensajeVinculacion(null);

    try {
      if (!('NDEFReader' in window)) {
        setMensajeVinculacion('❌ Tu navegador no soporta Web NFC. Usa Chrome en Android.');
        setLeyendoNFC(false);
        return;
      }

      // @ts-ignore — NDEFReader no tiene tipos oficiales aún
      const reader = new NDEFReader();
      await reader.scan();

      reader.onreading = async ({ serialNumber }: { serialNumber: string }) => {
        const nfcUid = serialNumber.toLowerCase().replace(/:/g, '');
        const resultado = await vincularNFC({ alumnoId: alumnoParaVincular, nfcUid });
        setMensajeVinculacion(resultado.mensaje);
        setLeyendoNFC(false);
        if (resultado.exito) {
          fetchData();
          router.refresh();
        }
      };

      reader.onreadingerror = () => {
        setMensajeVinculacion('❌ Error al leer la etiqueta NFC. Intenta de nuevo.');
        setLeyendoNFC(false);
      };
    } catch (err) {
      setMensajeVinculacion('❌ Error activando NFC. Verifica que esté habilitado.');
      setLeyendoNFC(false);
    }
  };

  const handleDesvincularNFC = async (alumnoId: string, nombre: string) => {
    if (confirm(`¿Deseas desvincular la etiqueta NFC de ${nombre}?`)) {
      const res = await desvincularNFC({ alumnoId });
      setMensajeVinculacion(res.mensaje);
      if (res.exito) {
        fetchData();
        router.refresh();
      }
    }
  };

  const exportToExcel = () => {
    const data = alumnos.map(a => {
      const row: Record<string, string | number> = {
        'Nº Alumno': a.numero_alumno,
        'Nombre': a.nombre || '',
        'Apellido': a.apellido || '',
        'Email': a.email || '',
        'Tipo Doc': a.tipo_documento || '',
        'Num Doc': a.numero_documento || '',
        'Teléfono': a.telefono || ''
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
    XLSX.writeFile(wb, `Planilla_Travesia_${format(mes, 'MMMM_yyyy', { locale: es })}.xlsx`);
  };

  if (loading) return <div>Cargando planilla...</div>;

  return (
    <div className="flex flex-col gap-6">

      {/* Acceso rápido a escáner NFC */}
      <Link
        href="/dashboard/nfc"
        style={{
          display: 'block',
          background: '#00ff88',
          color: '#000',
          border: '3px solid #00ff88',
          boxShadow: '4px 4px 0 #ff2d78',
          padding: '20px',
          textAlign: 'center',
          textDecoration: 'none',
          fontFamily: 'Anton, sans-serif',
          fontSize: '20px',
          letterSpacing: '2px',
          marginBottom: '8px',
        }}
      >
        📲 REGISTRAR ASISTENCIA CON NFC
      </Link>

      {/* Sección Gestión NFC */}
      <div style={{ background: '#111', border: '2px solid #333', padding: '24px', marginBottom: '8px' }}>
        <p style={{ color: '#ff2d78', fontFamily: 'Space Grotesk, monospace', fontSize: '11px', letterSpacing: '4px', margin: '0 0 16px', fontWeight: 'bold' }}>
          ETIQUETAS NFC
        </p>
        <h3 style={{ color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: '20px', margin: '0 0 20px' }}>
          VINCULAR NFC A ALUMNO
        </h3>

        <p style={{ color: '#aaa', fontFamily: 'Space Grotesk, monospace', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.6 }}>
          Para vincular una etiqueta: selecciona el alumno, toca &quot;LEER NFC Y VINCULAR&quot; y acerca la etiqueta del alumno al celular.
        </p>

        {/* Selector de alumno */}
        <select
          value={alumnoParaVincular}
          onChange={e => setAlumnoParaVincular(e.target.value)}
          style={{
            background: '#0a0a0a',
            color: '#fff',
            border: '1px solid #333',
            padding: '12px 16px',
            width: '100%',
            marginBottom: '12px',
            fontFamily: 'Space Grotesk, monospace',
            fontSize: '14px'
          }}
        >
          <option value="">Selecciona un alumno...</option>
          {alumnos.map(a => (
            <option key={a.id} value={a.id}>
              #{a.numero_alumno} — {a.nombre_completo}
              {a.nfc_uid ? ' ✅ (NFC vinculado)' : ' ⚠️ (sin NFC)'}
            </option>
          ))}
        </select>

        <button
          onClick={leerNFCParaVincular}
          disabled={!alumnoParaVincular || leyendoNFC}
          style={{
            background: !alumnoParaVincular ? '#222' : '#00ff88',
            color: !alumnoParaVincular ? '#555' : '#000',
            border: 'none',
            padding: '14px 24px',
            width: '100%',
            fontFamily: 'Anton, sans-serif',
            fontSize: '16px',
            letterSpacing: '2px',
            cursor: !alumnoParaVincular ? 'not-allowed' : 'pointer',
            marginBottom: '12px',
          }}
        >
          {leyendoNFC ? '📡 ACERCA LA ETIQUETA NFC...' : '📲 LEER NFC Y VINCULAR'}
        </button>

        {mensajeVinculacion && (
          <p style={{
            color: mensajeVinculacion.includes('✅') ? '#00ff88' : '#ff2d78',
            fontFamily: 'Space Grotesk, monospace',
            fontSize: '14px',
            margin: '8px 0 0 0',
            fontWeight: 'bold'
          }}>
            {mensajeVinculacion}
          </p>
        )}

        {/* Lista de alumnos con NFC vinculado (con opción de desvincular) */}
        {alumnos.filter(a => a.nfc_uid).length > 0 && (
          <div style={{ marginTop: '20px', borderTop: '1px solid #222', paddingTop: '16px' }}>
            <p style={{ color: '#00ff88', fontFamily: 'Space Grotesk, monospace', fontSize: '12px', letterSpacing: '2px', margin: '0 0 8px', fontWeight: 'bold' }}>
              CON NFC VINCULADO ({alumnos.filter(a => a.nfc_uid).length}):
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alumnos.filter(a => a.nfc_uid).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#181818', padding: '8px 12px', border: '1px solid #282828' }}>
                  <span style={{ color: '#fff', fontFamily: 'Space Grotesk, monospace', fontSize: '13px' }}>
                    #{a.numero_alumno} — {a.nombre_completo} <span style={{ color: '#00ff88', fontSize: '11px' }}>({a.nfc_uid})</span>
                  </span>
                  <button
                    onClick={() => handleDesvincularNFC(a.id, a.nombre_completo)}
                    style={{
                      background: 'transparent',
                      color: '#ff2d78',
                      border: '1px solid #ff2d78',
                      padding: '4px 8px',
                      fontFamily: 'Space Grotesk, monospace',
                      fontSize: '11px',
                      cursor: 'pointer',
                      marginLeft: 'auto'
                    }}
                  >
                    🗑️ DESVINCULAR
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de alumnos sin NFC vinculado */}
        {alumnos.filter(a => !a.nfc_uid).length > 0 && (
          <div style={{ marginTop: '20px', borderTop: '1px solid #222', paddingTop: '16px' }}>
            <p style={{ color: '#555', fontFamily: 'Space Grotesk, monospace', fontSize: '12px', letterSpacing: '2px', margin: '0 0 8px', fontWeight: 'bold' }}>
              SIN NFC VINCULADO ({alumnos.filter(a => !a.nfc_uid).length}):
            </p>
            {alumnos.filter(a => !a.nfc_uid).map(a => (
              <p key={a.id} style={{ color: '#666', fontFamily: 'Space Grotesk, monospace', fontSize: '13px', margin: '4px 0' }}>
                #{a.numero_alumno} — {a.nombre_completo}
              </p>
            ))}
          </div>
        )}
      </div>

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
              <Save size={14} /> {isSaving ? 'GUARDANDO...' : 'GUARDAR ASISTENCIA'}
            </button>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="tabla-admin overflow-x-auto max-h-[700px] border-4 border-white shadow-brutal">
        <table className="w-full border-collapse font-mono text-[10px]">
          <thead className="sticky top-0 z-20 bg-black">
            <tr className="border-b-2 border-white">
              <th className="p-3 text-left border-r border-white/20 w-12 sticky left-0 bg-black z-30">#</th>
              <th className="p-3 text-left border-r border-white/20 min-w-[200px] sticky left-12 bg-black z-30">ESTUDIANTE / IDENTIDAD</th>
              <th className="p-3 text-center border-r border-white/20 w-16">PERFIL</th>
              <th className="p-3 text-center border-r border-white/20 w-12">ELIM</th>
              {fechasMes.map((fecha, i) => (
                <th key={i} className="p-2 text-center border-r border-white/20 min-w-[60px]">
                  <span className="text-[8px] text-white/40 block">
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
                <td className="p-3 border-r border-white/20 sticky left-0 bg-[#1a1a1a] z-10 text-neon-green font-bold">
                    {alumno.numero_alumno}
                </td>
                <td className="p-3 border-r border-white/20 sticky left-12 bg-[#1a1a1a] z-10">
                   <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setAlumnoModal(alumno)}
                        style={{ background: 'none', border: 'none', color: '#b8d300',
                        cursor: 'pointer', fontFamily: 'Anton', fontSize: '16px',
                        textDecoration: 'underline', textUnderlineOffset: '4px', textAlign: 'left', padding: 0 }}>
                        {alumno.nombre_completo}
                      </button>
                      <div className="flex flex-wrap gap-3 text-[8px] text-white/40 font-bold uppercase">
                         <span
                           className="flex items-center gap-1 cursor-pointer hover:text-white"
                           onClick={() => {
                              const newNombre = prompt('Nuevo nombre completo:', alumno.nombre_completo);
                              if (newNombre) handleUpdateAlumno(alumno.id, { nombre_completo: newNombre });
                           }}
                         >
                           <ShieldCheck size={10} /> {alumno.tipo_documento?.replace('_', ' ') || '---'}
                         </span>
                         <span className="flex items-center gap-1"><Fingerprint size={10} /> {alumno.numero_documento || '---'}</span>
                         <span className="flex items-center gap-1"><Phone size={10} /> {alumno.telefono || '---'}</span>
                      </div>
                   </div>
                </td>
                <td className="p-3 border-r border-white/20 text-center">
                    {alumno.perfil_completo ? '✅' : '⚠️'}
                </td>
                <td className="p-3 border-r border-white/20 text-center">
                  <button
                    onClick={() => handleDeleteAlumno(alumno.id, alumno.nombre_completo)}
                    className="text-white/20 hover:text-hot-pink transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
                {fechasMes.map((fecha, i) => {
                  const fechaStr = format(fecha, 'yyyy-MM-dd');
                  const isPresent = asistencia.find(a => a.alumno_id === alumno.id && a.fecha === fechaStr)?.presente;
                  return (
                    <td key={i} className="p-0 border-r border-white/20">
                      <button
                        onClick={() => toggleAsistencia(alumno.id, fecha)}
                        className={`w-full h-12 flex items-center justify-center transition-colors ${isPresent ? 'bg-neon-green/20 text-neon-green font-black text-lg' : 'hover:bg-white/10 text-white/5'}`}
                      >
                        {isPresent ? '●' : '○'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alumno Info Modal */}
      {alumnoModal && (
        <div
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000] p-4"
            onClick={() => setAlumnoModal(null)}
        >
            <div
                className="bg-[#111] border-[3px] border-[#b8d300] p-8 max-w-[480px] w-full relative max-h-[90vh] overflow-y-auto shadow-brutal-lg"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={() => setAlumnoModal(null)}
                    className="absolute top-4 right-4 bg-transparent border-none text-white text-2xl cursor-pointer hover:text-hot-pink transition-colors"
                >
                    ✕
                </button>

                <h2 className="text-[#b8d300] font-anton text-2xl mb-1 uppercase">
                    {alumnoModal.nombre_completo}
                </h2>
                <p className="text-[#ffb1c4] text-[11px] tracking-[3px] mb-6 font-mono font-bold">
                    ALUMNO #{alumnoModal.numero_alumno}
                </p>

                <div className="grid gap-3">
                    {[
                        { label: 'Email', valor: alumnoModal.email || 'No registrado' },
                        { label: 'Teléfono', valor: alumnoModal.telefono || 'No registrado' },
                        { label: 'Fecha de nacimiento', valor: alumnoModal.fecha_nacimiento
                          ? new Date(alumnoModal.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
                          : 'No registrada'
                        },
                        { label: 'Tipo documento', valor: alumnoModal.tipo_documento?.replace('_', ' ') || 'No registrado' },
                        { label: 'Nº documento', valor: alumnoModal.numero_documento || 'No registrado' },
                        { label: 'Perfil', valor: alumnoModal.perfil_completo ? '✅ Completo' : '⚠️ Incompleto' },
                        { label: 'Estado', valor: alumnoModal.activo ? '✅ Activo' : '❌ Inactivo' },
                        { label: 'Inscripción pagada', valor: alumnoModal.inscripcion_pagada ? '✅ Sí' : '❌ Pendiente' },
                        { label: 'Vencimiento seguro', valor: (() => {
                            if (!alumnoModal.fecha_vencimiento_seguro) return 'No registrado';
                            try {
                              const date = new Date(alumnoModal.fecha_vencimiento_seguro + 'T00:00:00');
                              const months = [
                                'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
                              ];
                              return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
                            } catch {
                              return alumnoModal.fecha_vencimiento_seguro;
                            }
                          })()
                        },
                    ].map(({ label, valor }) => (
                        <div key={label} className="flex gap-3 border-b border-[#222] pb-2 items-center">
                            <span className="text-[#666] text-[10px] tracking-[2px] min-w-[140px] uppercase font-mono">{label}</span>
                            <span className="text-white text-xs font-mono">{valor}</span>
                        </div>
                    ))}
                </div>

                {/* Plan activo logic (find plan for current period if exists) */}
                {alumnoModal.inscripciones && alumnoModal.inscripciones.length > 0 && (
                    <div className="mt-6 pt-5 border-t-2 border-[#333]">
                        <p className="text-[#ffb1c4] text-[11px] tracking-[3px] mb-4 font-mono font-bold uppercase tracking-widest">Plan Actual</p>
                        {[
                            { label: 'Plan', valor: alumnoModal.inscripciones[0].plan?.nombre },
                            { label: 'Precio', valor: `$${alumnoModal.inscripciones[0].plan?.precio?.toLocaleString('es-CO')}` },
                            { label: 'Clases', valor: `${alumnoModal.inscripciones[0].clases_usadas} / ${alumnoModal.inscripciones[0].plan?.clases_incluidas}` },
                            { label: 'Estado pago', valor: alumnoModal.inscripciones[0].estado },
                            { label: 'Vence', valor: alumnoModal.inscripciones[0].fecha_vencimiento ? format(new Date(alumnoModal.inscripciones[0].fecha_vencimiento), 'dd/MM/yyyy') : 'No definida' },
                        ].map(({ label, valor }) => (
                            <div key={label} className="flex gap-3 border-b border-[#222] pb-2 mb-2 items-center">
                                <span className="text-[#666] text-[10px] tracking-[2px] min-w-[140px] uppercase font-mono">{label}</span>
                                <span className="text-white text-xs font-mono uppercase">{valor}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Add Alumno Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131313] border-4 border-white p-8 max-w-md w-full shadow-brutal-lg">
            <h2 className="font-anton text-3xl uppercase mb-6 flex items-center gap-2"><UserIcon className="text-neon-green" /> Nuevo Alumno</h2>
            <form onSubmit={handleAddAlumno} className="flex flex-col gap-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-white/40 uppercase">Nombre</label>
                    <input type="text" required value={newAlumno.nombre} onChange={e => setNewAlumno({...newAlumno, nombre: e.target.value})} className="bg-transparent border-b-2 border-white/20 p-2 outline-none focus:border-neon-green font-mono uppercase text-xs" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-white/40 uppercase">Apellido</label>
                    <input type="text" required value={newAlumno.apellido} onChange={e => setNewAlumno({...newAlumno, apellido: e.target.value})} className="bg-transparent border-b-2 border-white/20 p-2 outline-none focus:border-neon-green font-mono uppercase text-xs" />
                  </div>
               </div>
               <div className="flex flex-col gap-1">
                 <label className="font-mono text-[10px] text-white/40 uppercase">Email</label>
                 <input type="email" value={newAlumno.email} onChange={e => setNewAlumno({...newAlumno, email: e.target.value})} className="bg-transparent border-b-2 border-white/20 p-2 outline-none focus:border-neon-green font-mono text-xs" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-white/40 uppercase">Tipo Doc</label>
                    <select value={newAlumno.tipo_documento} onChange={e => setNewAlumno({...newAlumno, tipo_documento: e.target.value})} className="bg-black border-b-2 border-white/20 p-2 outline-none focus:border-neon-green font-mono text-xs">
                        <option value="">...</option>
                        <option value="cedula_ciudadania">CC</option>
                        <option value="tarjeta_identidad">TI</option>
                        <option value="pasaporte">Pasaporte</option>
                        <option value="nit">NIT</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-white/40 uppercase">Nº Documento</label>
                    <input type="text" value={newAlumno.numero_documento} onChange={e => setNewAlumno({...newAlumno, numero_documento: e.target.value})} className="bg-transparent border-b-2 border-white/20 p-2 outline-none focus:border-neon-green font-mono text-xs" />
                  </div>
               </div>
               <div className="flex flex-col gap-1">
                 <label className="font-mono text-[10px] text-white/40 uppercase">Teléfono</label>
                 <input type="text" value={newAlumno.telefono} onChange={e => setNewAlumno({...newAlumno, telefono: e.target.value})} className="bg-transparent border-b-2 border-white/20 p-2 outline-none focus:border-neon-green font-mono text-xs" />
               </div>
               <div className="flex gap-4 mt-6">
                 <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 border border-white/20 py-3 font-mono text-xs hover:bg-white/5">CANCELAR</button>
                 <button type="submit" className="flex-1 bg-neon-green text-black font-anton text-xl py-3 hover:brightness-110">GUARDAR</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
