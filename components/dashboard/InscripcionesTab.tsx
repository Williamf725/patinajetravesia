'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Inscripcion, Alumno, Plan } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { updateInscripcionEstado } from '@/app/auth/actions/admin';
import { ClipboardList, Check, X, Filter, Search, ShieldCheck, Fingerprint, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { calcularEstadoPlan } from '@/lib/planes';

export default function InscripcionesTab() {
  const [items, setItems] = useState<Inscripcion[]>([]);
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('pendiente');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(true);
  const [seguroSearch, setSeguroSearch] = useState('');
  const [selectedAlumnoForInscripcion, setSelectedAlumnoForInscripcion] = useState<Alumno | null>(null);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [selectedComprobanteUrl, setSelectedComprobanteUrl] = useState<string | null>(null);

  const abrirModalComprobante = (url: string) => {
    setSelectedComprobanteUrl(url);
  };

  const supabase = createClient();

  const fetchInscripciones = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inscripciones')
      .select('*, alumno:alumnos(*), plan:planes(*)')
      .order('estado', { ascending: false })
      .order('created_at', { ascending: false });

    setItems((data as Inscripcion[]) || []);
    setLoading(false);
  }, [supabase]);

  const fetchAlumnos = useCallback(async () => {
    setLoadingAlumnos(true);
    const { data } = await supabase
      .from('alumnos')
      .select('*')
      .order('numero_alumno', { ascending: true });
    setAlumnos((data as Alumno[]) || []);
    setLoadingAlumnos(false);
  }, [supabase]);

  const fetchPlanes = useCallback(async () => {
    const { data } = await supabase.from('planes').select('*');
    setPlanes((data as Plan[]) || []);
  }, [supabase]);

  useEffect(() => {
    fetchInscripciones();
    fetchAlumnos();
    fetchPlanes();
  }, [fetchInscripciones, fetchAlumnos, fetchPlanes]);

  const handleTogglePago = async (alumnoId: string, newVal: boolean, currentFechaPago: string | null | undefined) => {
    try {
      if (newVal) {
        const fechaPago = currentFechaPago || new Date().toISOString().split('T')[0];
        const fechaVenc = new Date(
          new Date(fechaPago).setFullYear(new Date(fechaPago).getFullYear() + 1)
        ).toISOString().split('T')[0];

        const { error } = await supabase
          .from('alumnos')
          .update({
            inscripcion_pagada: true,
            fecha_pago_inscripcion: fechaPago,
            fecha_vencimiento_seguro: fechaVenc
          })
          .eq('id', alumnoId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('alumnos')
          .update({
            inscripcion_pagada: false,
            fecha_pago_inscripcion: null,
            fecha_vencimiento_seguro: null
          })
          .eq('id', alumnoId);

        if (error) throw error;
      }

      fetchAlumnos();
      fetchInscripciones();
    } catch (err) {
      alert('Error al actualizar inscripción: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleFechaPagoChange = async (alumnoId: string, dateVal: string) => {
    try {
      if (!dateVal) {
        const { error } = await supabase
          .from('alumnos')
          .update({
            fecha_pago_inscripcion: null,
            fecha_vencimiento_seguro: null
          })
          .eq('id', alumnoId);
        if (error) throw error;
      } else {
        const fechaVenc = new Date(
          new Date(dateVal).setFullYear(new Date(dateVal).getFullYear() + 1)
        ).toISOString().split('T')[0];

        const { error } = await supabase
          .from('alumnos')
          .update({
            fecha_pago_inscripcion: dateVal,
            fecha_vencimiento_seguro: fechaVenc
          })
          .eq('id', alumnoId);
        if (error) throw error;
      }

      fetchAlumnos();
      fetchInscripciones();
    } catch (err) {
      alert('Error al actualizar fecha de pago: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleObservacionesLocalChange = (alumnoId: string, textVal: string) => {
    setAlumnos(prev => prev.map(a => a.id === alumnoId ? { ...a, observaciones: textVal } : a));
  };

  const handleObservacionesSave = async (alumnoId: string, textVal: string) => {
    try {
      const { error } = await supabase
        .from('alumnos')
        .update({ observaciones: textVal || null })
        .eq('id', alumnoId);
      if (error) throw error;

      fetchAlumnos();
      fetchInscripciones();
    } catch (err) {
      alert('Error al guardar observaciones: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleApproveInscripcionSeguro = async (alumno: Alumno) => {
    try {
      const fechaPago = new Date().toISOString().split('T')[0];
      const fechaVenc = new Date(
        new Date().setFullYear(new Date().getFullYear() + 1)
      ).toISOString().split('T')[0];

      const { error } = await supabase
        .from('alumnos')
        .update({
          inscripcion_pagada: true,
          comprobante_inscripcion_pendiente: false,
          fecha_pago_inscripcion: fechaPago,
          fecha_vencimiento_seguro: fechaVenc
        })
        .eq('id', alumno.id);

      if (error) throw error;

      if (alumno.tipo_pago_inscripcion === 'inscripcion_y_plan') {
        const { error: planError } = await supabase
          .from('inscripciones')
          .update({
            estado: 'aprobado',
            fecha_aprobacion: new Date().toISOString(),
            comprobante_verificado: true
          })
          .eq('alumno_id', alumno.id)
          .eq('estado', 'pendiente');

        if (planError) {
          console.warn("No pending monthly plan found or update error:", planError);
        }
      }

      toast.success('Póliza activada con éxito');
      fetchAlumnos();
      fetchInscripciones();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleRejectInscripcionSeguro = async (alumnoId: string) => {
    try {
      const { error } = await supabase
        .from('alumnos')
        .update({
          comprobante_inscripcion_url: null,
          comprobante_inscripcion_pendiente: false
        })
        .eq('id', alumnoId);

      if (error) throw error;

      toast.success('Comprobante rechazado con éxito');
      fetchAlumnos();
      fetchInscripciones();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleAction = async (id: string, estado: 'aprobado' | 'rechazado' | 'pendiente') => {
    try {
      await updateInscripcionEstado(id, estado);
      fetchInscripciones();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'todos' || item.estado === filter;
    const matchesSearch = item.alumno?.nombre_completo.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const estadoA = calcularEstadoPlan(a);
    const estadoB = calcularEstadoPlan(b);

    const pesoEstado = {
      agotado: 1,
      pocas_clases: 2,
      renovacion_pendiente: 3,
      activo: 4,
      sin_plan: 5,
    };

    const pesoA = pesoEstado[estadoA] || 99;
    const pesoB = pesoEstado[estadoB] || 99;

    if (pesoA !== pesoB) {
      return pesoA - pesoB;
    }

    if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1;
    if (a.estado !== 'pendiente' && b.estado === 'pendiente') return 1;

    const numA = a.alumno?.numero_alumno || 999;
    const numB = b.alumno?.numero_alumno || 999;
    return numA - numB;
  });

  const filteredAlumnos = alumnos.filter(a => {
    const term = seguroSearch.toLowerCase();
    return a.nombre_completo.toLowerCase().includes(term) ||
           (a.email && a.email.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-8">
      {/* Filters Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[#1a1a1a] p-6 border-4 border-white shadow-brutal">
        <div className="flex items-center gap-4">
           <div className="bg-neon-green p-2 text-black">
              <ClipboardList size={24} />
           </div>
           <div>
             <h2 className="font-anton text-3xl uppercase leading-none">Inscripciones</h2>
             <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.3em]">Gestión de Solicitudes</p>
           </div>
        </div>

        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-2 border border-white/10 flex-grow lg:flex-grow-0">
            <Search size={16} className="text-white/40" />
            <input
              type="text"
              placeholder="BUSCAR ALUMNO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none font-mono text-[10px] uppercase text-white w-full"
            />
          </div>

          <div className="flex items-center gap-2 bg-black/40 px-3 py-2 border border-white/10">
            <Filter size={16} className="text-neon-green" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'todos' | 'pendiente' | 'aprobado' | 'rechazado')}
              className="bg-transparent outline-none font-mono text-[10px] uppercase text-white cursor-pointer"
            >
              <option value="pendiente" className="bg-[#131313]">PENDIENTES</option>
              <option value="aprobado" className="bg-[#131313]">APROBADOS</option>
              <option value="rechazado" className="bg-[#131313]">RECHAZADOS</option>
              <option value="todos" className="bg-[#131313]">TODOS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="tabla-admin bg-[#1a1a1a] border-4 border-white shadow-brutal overflow-x-auto">
        <table className="w-full font-mono text-[10px] uppercase tracking-tighter text-left">
          <thead>
            <tr className="bg-black border-b-4 border-white">
              <th className="p-4 border-r border-white/20">#</th>
              <th className="p-4 border-r border-white/20 min-w-[200px]">Estudiante / Identidad</th>
              <th className="p-4 border-r border-white/20">Perfil</th>
              <th className="p-4 border-r border-white/20">Plan Escogido</th>
              <th className="p-4 border-r border-white/20 text-center">Estado Plan</th>
              <th className="p-4 border-r border-white/20 text-center">Comprobante Renovación</th>
              <th className="p-4 border-r border-white/20 text-center">Precio</th>
              <th className="p-4 border-r border-white/20">Mes / Anio</th>
              <th className="p-4 border-r border-white/20">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="p-10 text-center animate-pulse">CARGANDO...</td></tr>
            ) : sortedItems.length === 0 ? (
              <tr><td colSpan={10} className="p-10 text-center text-white/20">NO HAY REGISTROS QUE COINCIDAN</td></tr>
            ) : (
              sortedItems.map((item) => (
                <tr key={item.id} className={`border-b border-white/10 hover:bg-white/5 transition-colors ${item.estado === 'pendiente' ? 'bg-yellow-400/5' : ''}`}>
                  <td className="p-4 border-r border-white/20 font-bold text-neon-green">
                    {item.alumno?.numero_alumno}
                  </td>
                  <td className="p-4 border-r border-white/20">
                    <div className="flex flex-col gap-1">
                        <span className="font-anton text-sm uppercase text-white">{item.alumno?.nombre_completo}</span>
                        <div className="flex flex-wrap gap-2 text-[8px] text-white/40 font-bold">
                            <span className="flex items-center gap-0.5"><ShieldCheck size={8} /> {item.alumno?.tipo_documento || '---'}</span>
                            <span className="flex items-center gap-0.5"><Fingerprint size={8} /> {item.alumno?.numero_documento || '---'}</span>
                            <span className="flex items-center gap-0.5"><Phone size={8} /> {item.alumno?.telefono || '---'}</span>
                        </div>
                        <span className="text-[7px] text-white/20">{item.alumno?.email}</span>
                    </div>
                  </td>
                  <td className="p-4 border-r border-white/20 text-center">
                    {item.alumno?.perfil_completo ? '✅' : '⚠️'}
                  </td>
                  <td className="p-4 border-r border-white/20">
                    {item.plan?.nombre}
                  </td>
                  <td className="p-4 border-r border-white/20 text-center">
                    {(() => {
                      const estado = calcularEstadoPlan(item)
                      const config = {
                        activo: { color: '#00ff88', bg: 'rgba(0,255,136,0.1)', texto: '✅ ACTIVO' },
                        pocas_clases: { color: 'orange', bg: 'rgba(255,165,0,0.1)', texto: '⚡ 1 CLASE' },
                        agotado: { color: '#ff2d78', bg: 'rgba(255,45,120,0.1)', texto: '🔴 AGOTADO' },
                        renovacion_pendiente: { color: '#00ff88', bg: 'rgba(0,255,136,0.05)', texto: '⏳ RENOVANDO' },
                        sin_plan: { color: '#555', bg: 'transparent', texto: '— SIN PLAN' },
                      }[estado]

                      return (
                        <span style={{
                          background: config.bg, color: config.color,
                          border: `1px solid ${config.color}`,
                          padding: '4px 10px', fontFamily: 'Space Grotesk',
                          fontSize: '11px', letterSpacing: '1px', whiteSpace: 'nowrap',
                        }}>
                          {config.texto}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="p-4 border-r border-white/20 text-center">
                    {item.renovacion_pendiente && item.comprobante_url ? (
                      <button
                        onClick={() => abrirModalComprobante(item.comprobante_url!)}
                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-[9px] px-2 py-1 uppercase cursor-pointer"
                      >
                        🧾 Ver nuevo comprobante
                      </button>
                    ) : item.renovacion_pendiente && !item.comprobante_url ? (
                      <span style={{ color: 'orange', fontSize: '12px', fontFamily: 'Space Grotesk' }}>
                        ⚠️ Sin comprobante aún
                      </span>
                    ) : (
                      <span style={{ color: '#555', fontSize: '12px', fontFamily: 'Space Grotesk' }}>
                        —
                      </span>
                    )}
                  </td>
              <td className="p-4 border-r border-white/20 text-center font-mono text-neon-green">
                    ${item.plan?.precio.toLocaleString()}
              </td>
              <td className="p-4 border-r border-white/20 font-bold uppercase">
                {item.mes} {item.anio}
              </td>
                  <td className="p-4 border-r border-white/20">
                    <span className={`px-2 py-1 border ${
                      item.estado === 'aprobado' ? 'border-neon-green text-neon-green bg-neon-green/10' :
                      item.estado === 'pendiente' ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' :
                      'border-hot-pink text-hot-pink bg-hot-pink/10'
                    }`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="p-4">
                    {item.estado === 'pendiente' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(item.id, 'aprobado')}
                          className="bg-neon-green text-black px-2 py-1 font-anton text-[10px] flex items-center gap-1 hover:scale-105 active:scale-95"
                        >
                          <Check size={12} /> APROBAR
                        </button>
                        <button
                          onClick={() => handleAction(item.id, 'rechazado')}
                          className="bg-hot-pink text-white px-2 py-1 font-anton text-[10px] flex items-center gap-1 hover:scale-105 active:scale-95"
                        >
                          <X size={12} /> RECHAZAR
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                         <button
                          onClick={() => handleAction(item.id, 'pendiente')}
                          className="text-white/20 hover:text-white transition-colors"
                          title="Restablecer a Pendiente"
                        >
                          <Filter size={14} />
                        </button>
                        <span className="text-[8px] text-white/20 uppercase">
                          {item.estado === 'aprobado' ? 'Confirmado' : 'Rechazado'}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sección Inscripciones y Seguros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[#1a1a1a] p-6 border-4 border-white shadow-brutal mt-12">
        <div className="flex items-center gap-4">
           <div className="bg-neon-green p-2 text-black">
              <ShieldCheck size={24} />
           </div>
           <div>
             <h2 className="font-anton text-3xl uppercase leading-none">Inscripciones y Seguros</h2>
             <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.3em]">Control de Pólizas de Seguro Mundial</p>
           </div>
        </div>

        {/* Search bar specifically for this table */}
        <div className="flex items-center gap-2 bg-black/40 px-3 py-2 border border-white/10 w-full lg:w-64">
          <Search size={16} className="text-white/40" />
          <input
            type="text"
            placeholder="BUSCAR ALUMNO..."
            value={seguroSearch}
            onChange={(e) => setSeguroSearch(e.target.value)}
            className="bg-transparent outline-none font-mono text-[10px] uppercase text-white w-full"
          />
        </div>
      </div>

      <div className="tabla-admin bg-[#1a1a1a] border-4 border-white shadow-brutal overflow-x-auto">
        <table className="w-full font-mono text-[10px] uppercase tracking-tighter text-left">
          <thead>
            <tr className="bg-black border-b-4 border-white">
              <th className="p-4 border-r border-white/20">Nº</th>
              <th className="p-4 border-r border-white/20 min-w-[200px]">Nombre Completo</th>
              <th className="p-4 border-r border-white/20">Email</th>
              <th className="p-4 border-r border-white/20 text-center">Inscripción Pagada</th>
              <th className="p-4 border-r border-white/20 text-center">Fecha Pago</th>
              <th className="p-4 border-r border-white/20 text-center">Vencimiento Seguro</th>
              <th className="p-4 border-r border-white/20 text-center">Comprobante Inscripción</th>
              <th className="p-4">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {loadingAlumnos ? (
              <tr><td colSpan={8} className="p-10 text-center animate-pulse">CARGANDO ALUMNOS...</td></tr>
            ) : filteredAlumnos.length === 0 ? (
              <tr><td colSpan={8} className="p-10 text-center text-white/20">NO HAY ALUMNOS QUE COINCIDAN</td></tr>
            ) : (
              filteredAlumnos.map((a) => {
                // Determine expiration status color
                // Resaltar en rojo las filas donde el seguro ya venció, en naranja las que vencen en menos de 30 días.
                let rowBgClass = "";
                let vencLabelColorClass = "text-white";

                if (a.inscripcion_pagada && a.fecha_vencimiento_seguro) {
                  const hoy = new Date();
                  hoy.setHours(0,0,0,0);
                  const venc = new Date(a.fecha_vencimiento_seguro + 'T00:00:00');
                  venc.setHours(0,0,0,0);
                  const diff = venc.getTime() - hoy.getTime();
                  const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

                  if (diffDays < 0) {
                    rowBgClass = "bg-red-950/40 border-l-4 border-l-hot-pink";
                    vencLabelColorClass = "text-hot-pink font-bold";
                  } else if (diffDays <= 30) {
                    rowBgClass = "bg-orange-950/40 border-l-4 border-l-orange-500";
                    vencLabelColorClass = "text-orange-500 font-bold";
                  }
                }

                return (
                  <tr key={a.id} className={`border-b border-white/10 hover:bg-white/5 transition-colors ${rowBgClass}`}>
                    <td className="p-4 border-r border-white/20 font-bold text-neon-green">
                      {a.numero_alumno}
                    </td>
                    <td className="p-4 border-r border-white/20 font-anton text-sm text-white">
                      {a.nombre_completo}
                    </td>
                    <td className="p-4 border-r border-white/20 text-[9px] text-white/60">
                      {a.email}
                    </td>
                    <td className="p-4 border-r border-white/20 text-center">
                      <button
                        onClick={() => handleTogglePago(a.id, !a.inscripcion_pagada, a.fecha_pago_inscripcion)}
                        className={`px-3 py-1.5 font-anton text-[10px] tracking-wider transition-transform hover:scale-105 active:scale-95 ${
                          a.inscripcion_pagada
                            ? 'bg-neon-green text-black'
                            : 'bg-hot-pink text-white'
                        }`}
                      >
                        {a.inscripcion_pagada ? '✅ SÍ' : '❌ PENDIENTE'}
                      </button>
                    </td>
                    <td className="p-4 border-r border-white/20 text-center">
                      <input
                        type="date"
                        value={a.fecha_pago_inscripcion || ''}
                        onChange={(e) => handleFechaPagoChange(a.id, e.target.value)}
                        className="bg-black/60 border border-white/20 p-1.5 text-white text-[10px] outline-none focus:border-neon-green w-full max-w-[130px]"
                      />
                    </td>
                    <td className={`p-4 border-r border-white/20 text-center ${vencLabelColorClass}`}>
                      {a.fecha_vencimiento_seguro ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold">{a.fecha_vencimiento_seguro}</span>
                          <span className="text-[8px] opacity-60">
                            ({new Date(a.fecha_vencimiento_seguro + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })})
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/20 italic">No activo</span>
                      )}
                    </td>
                    <td className="p-4 border-r border-white/20 text-center">
                      {!a.comprobante_inscripcion_url ? (
                        <span className="text-white/20 italic">Sin comprobante</span>
                      ) : a.comprobante_inscripcion_pendiente ? (
                        <button
                          onClick={() => setSelectedAlumnoForInscripcion(a)}
                          className="bg-yellow-400 text-black px-2.5 py-1.5 font-anton text-[9px] hover:scale-105 active:scale-95 transition-transform shrink-0"
                        >
                          Ver comprobante
                        </button>
                      ) : (
                        <span className="text-neon-green font-bold">
                          ✅ Verificado
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        value={a.observaciones || ''}
                        onChange={(e) => handleObservacionesLocalChange(a.id, e.target.value)}
                        onBlur={(e) => handleObservacionesSave(a.id, e.target.value)}
                        placeholder="..."
                        className="bg-transparent border-b border-white/10 hover:border-white/30 text-[10px] text-white outline-none focus:border-neon-green w-full p-1"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Proof Preview Modal */}
      {selectedAlumnoForInscripcion && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedAlumnoForInscripcion(null)}
        >
          <div
            className="bg-[#131313] border-4 border-white max-w-2xl w-full max-h-[95vh] flex flex-col shadow-brutal relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAlumnoForInscripcion(null)}
              className="absolute -top-4 -right-4 bg-hot-pink text-white p-2 border-2 border-white hover:scale-110 transition-transform z-10"
            >
              <X size={24} />
            </button>

            <div className="p-4 border-b-2 border-white flex justify-between items-center bg-white/5">
              <h3 className="font-anton text-xl tracking-wider text-white uppercase italic">COMPROBANTE DE INSCRIPCIÓN</h3>
              <p className="font-mono text-xs text-neon-green uppercase font-bold">
                 Alumno #{selectedAlumnoForInscripcion.numero_alumno}
              </p>
            </div>

            <div className="flex-1 overflow-auto p-4 flex flex-col items-center gap-4 bg-black/50">
              {selectedAlumnoForInscripcion.tipo_pago_inscripcion === 'inscripcion_y_plan' && (
                <div className="w-full bg-[#ffcc00]/10 border-l-4 border-[#ffcc00] p-3 text-[#ffcc00] font-mono text-[10px] uppercase">
                  <strong>Plan Escogido:</strong> {
                    planes.find(p => p.id === selectedAlumnoForInscripcion.plan_inscripcion_id)?.nombre || 'Inscripción + Plan'
                  } (${
                    planes.find(p => p.id === selectedAlumnoForInscripcion.plan_inscripcion_id)?.precio.toLocaleString() || '---'
                  } COP)
                  <p className="text-white/60 text-[8px] mt-1">Al verificar esta inscripción, se auto-aprobará el plan mensual del estudiante.</p>
                </div>
              )}

              {selectedAlumnoForInscripcion.comprobante_inscripcion_url ? (
                selectedAlumnoForInscripcion.comprobante_inscripcion_url.toLowerCase().endsWith('.pdf') ? (
                  <a
                    href={selectedAlumnoForInscripcion.comprobante_inscripcion_url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white/10 text-white p-6 border border-white/20 flex flex-col items-center gap-2 hover:bg-white/20 transition-all font-mono text-xs uppercase"
                  >
                     <span className="text-4xl">📄</span> Ver Documento PDF Externo
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedAlumnoForInscripcion.comprobante_inscripcion_url}
                    alt="Comprobante de Inscripción"
                    className="max-w-full max-h-[50vh] object-contain border-2 border-white/10"
                  />
                )
              ) : (
                <p className="text-white/40 italic text-xs">Sin comprobante subido</p>
              )}
            </div>

            <div className="p-6 border-t-2 border-white bg-white/5 space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={async () => {
                    await handleApproveInscripcionSeguro(selectedAlumnoForInscripcion);
                    setSelectedAlumnoForInscripcion(null);
                  }}
                  className="flex-1 bg-neon-green text-black font-anton uppercase text-sm py-3 hover:scale-105 transition-transform"
                >
                  Verificar y activar póliza
                </button>
                <button
                  onClick={async () => {
                    await handleRejectInscripcionSeguro(selectedAlumnoForInscripcion.id);
                    setSelectedAlumnoForInscripcion(null);
                  }}
                  className="bg-hot-pink text-white font-anton uppercase text-sm px-6 py-3 hover:scale-105 transition-transform"
                >
                  Rechazar
                </button>
              </div>

              <button
                onClick={() => setSelectedAlumnoForInscripcion(null)}
                className="w-full text-center font-mono text-[10px] text-white/40 uppercase hover:text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renewal Proof Preview Modal */}
      {selectedComprobanteUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedComprobanteUrl(null)}
        >
          <div
            className="bg-[#131313] border-4 border-white max-w-2xl w-full max-h-[95vh] flex flex-col shadow-brutal relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedComprobanteUrl(null)}
              className="absolute -top-4 -right-4 bg-hot-pink text-white p-2 border-2 border-white hover:scale-110 transition-transform z-10"
            >
              <X size={24} />
            </button>

            <div className="p-4 border-b-2 border-white flex justify-between items-center bg-white/5">
              <h3 className="font-anton text-xl tracking-wider text-white uppercase italic">COMPROBANTE DE RENOVACIÓN</h3>
            </div>

            <div className="flex-1 overflow-auto p-4 flex flex-col items-center gap-4 bg-black/50">
              {selectedComprobanteUrl.toLowerCase().endsWith('.pdf') ? (
                <a
                  href={selectedComprobanteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white/10 text-white p-6 border border-white/20 flex flex-col items-center gap-2 hover:bg-white/20 transition-all font-mono text-xs uppercase"
                >
                   <span className="text-4xl">📄</span> Ver Documento PDF Externo
                </a>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedComprobanteUrl}
                  alt="Comprobante de Renovación"
                  className="max-w-full max-h-[50vh] object-contain border-2 border-white/10"
                />
              )}
            </div>

            <div className="p-6 border-t-2 border-white bg-white/5">
              <button
                onClick={() => setSelectedComprobanteUrl(null)}
                className="w-full bg-neon-green text-black font-anton uppercase text-sm py-3 hover:scale-105 transition-transform"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
