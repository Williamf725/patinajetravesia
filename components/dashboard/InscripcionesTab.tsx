'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Inscripcion } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { updateInscripcionEstado } from '@/app/auth/actions/admin';
import { ClipboardList, Check, X, Filter, Search } from 'lucide-react';

export default function InscripcionesTab() {
  const [items, setItems] = useState<Inscripcion[]>([]);
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('pendiente');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchInscripciones();
  }, [fetchInscripciones]);

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

  // Sort: Pendiente first
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1;
    if (a.estado !== 'pendiente' && b.estado === 'pendiente') return 1;
    return 0;
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
      <div className="bg-[#1a1a1a] border-4 border-white shadow-brutal overflow-x-auto">
        <table className="w-full font-mono text-[10px] uppercase tracking-tighter text-left">
          <thead>
            <tr className="bg-black border-b-4 border-white">
              <th className="p-4 border-r border-white/20">Nº Alumno</th>
              <th className="p-4 border-r border-white/20">Nombre Completo</th>
              <th className="p-4 border-r border-white/20">Email</th>
              <th className="p-4 border-r border-white/20">Plan Escogido</th>
              <th className="p-4 border-r border-white/20 text-center">Precio</th>
              <th className="p-4 border-r border-white/20">Mes / Anio</th>
              <th className="p-4 border-r border-white/20">Estado</th>
              <th className="p-4 border-r border-white/20">Fecha</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-10 text-center animate-pulse">CARGANDO...</td></tr>
            ) : sortedItems.length === 0 ? (
              <tr><td colSpan={9} className="p-10 text-center text-white/20">NO HAY REGISTROS QUE COINCIDAN</td></tr>
            ) : (
              sortedItems.map((item) => (
                <tr key={item.id} className={`border-b border-white/10 hover:bg-white/5 transition-colors ${item.estado === 'pendiente' ? 'bg-yellow-400/5' : ''}`}>
                  <td className="p-4 border-r border-white/20 font-bold text-neon-green">
                    #{item.alumno?.numero_alumno}
                  </td>
                  <td className="p-4 border-r border-white/20 font-anton uppercase">
                    {item.alumno?.nombre_completo}
                  </td>
                  <td className="p-4 border-r border-white/20 text-white/60">
                    {item.alumno?.email}
                  </td>
                  <td className="p-4 border-r border-white/20">
                    {item.plan?.nombre}
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
                  <td className="p-4 border-r border-white/20 text-white/40">
                    {new Date(item.created_at).toLocaleDateString()}
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
                          {item.estado === 'aprobado' ? 'Confirmado' : 'Rechazado'} {item.fecha_confirmacion ? new Date(item.fecha_confirmacion).toLocaleDateString() : ''}
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
    </div>
  );
}
