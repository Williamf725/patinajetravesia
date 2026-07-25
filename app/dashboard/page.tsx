'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AsistenciaTab from '@/components/dashboard/AsistenciaTab';
import PagosTab from '@/components/dashboard/PagosTab';
import GaleriaTab from '@/components/dashboard/GaleriaTab';
import InscripcionesTab from '@/components/dashboard/InscripcionesTab';
import TiendaTab from '@/components/dashboard/TiendaTab';
import { Users, CreditCard, Image as ImageIcon, LogOut, ClipboardList, ShoppingBag } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { obtenerDatosExport } from '@/app/auth/actions/admin';

const ADMIN_EMAIL = 'clubdepatinajetravesia@gmail.com';

type Tab = 'asistencia' | 'pagos' | 'galeria' | 'inscripciones' | 'tienda';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('inscripciones');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const exportarExcel = async () => {
    try {
      setExportando(true);
      const alumnos = await obtenerDatosExport();

      // Hoja 1 — Información personal
      const datosPersonales = alumnos.map(a => ({
        'Nº Alumno': a.numero_alumno,
        'Nombre': a.nombre,
        'Apellido': a.apellido,
        'Nombre Completo': a.nombre_completo,
        'Email': a.email,
        'Teléfono': a.telefono || 'No registrado',
        'Tipo Documento': a.tipo_documento?.replace('_', ' ') || 'No registrado',
        'Nº Documento': a.numero_documento || 'No registrado',
        'Fecha Nacimiento': a.fecha_nacimiento
          ? (() => {
              const date = new Date(a.fecha_nacimiento + 'T00:00:00');
              const dd = String(date.getDate()).padStart(2, '0');
              const mm = String(date.getMonth() + 1).padStart(2, '0');
              return `${dd}/${mm}/${date.getFullYear()}`;
            })()
          : 'No registrada',
        'Perfil Completo': a.perfil_completo ? 'Sí' : 'No',
        'Estado': a.activo ? 'Activo' : 'Inactivo',
        'Inscripción Pagada': a.inscripcion_pagada ? 'Sí' : 'No',
        'Fecha Pago Inscripción': a.fecha_pago_inscripcion
          ? (() => {
              const date = new Date(a.fecha_pago_inscripcion + 'T00:00:00');
              const dd = String(date.getDate()).padStart(2, '0');
              const mm = String(date.getMonth() + 1).padStart(2, '0');
              return `${dd}/${mm}/${date.getFullYear()}`;
            })()
          : 'No registrada',
        'Vencimiento Seguro': a.fecha_vencimiento_seguro
          ? (() => {
              const date = new Date(a.fecha_vencimiento_seguro + 'T00:00:00');
              const dd = String(date.getDate()).padStart(2, '0');
              const mm = String(date.getMonth() + 1).padStart(2, '0');
              return `${dd}/${mm}/${date.getFullYear()}`;
            })()
          : 'No registrada',
        'Fecha Registro': (() => {
          const date = new Date(a.created_at);
          const dd = String(date.getDate()).padStart(2, '0');
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          return `${dd}/${mm}/${date.getFullYear()}`;
        })(),
      }));

      // Hoja 2 — Planes e inscripciones
      const datosPlanes: Record<string, unknown>[] = [];
      alumnos.forEach(a => {
        if (a.inscripciones && a.inscripciones.length > 0) {
          a.inscripciones.forEach((i) => {
            const precioPlanVal = i.plan?.precio
              ? `$${i.plan.precio.toLocaleString('es-CO')}`
              : '-';
            const clasesIncluidasVal = i.plan?.clases_incluidas || 0;
            const totalPagadoVal = i.total_pagado
              ? `$${Number(i.total_pagado).toLocaleString('es-CO')}`
              : '$0';
            const saldoPendienteVal = i.plan?.precio
              ? `$${(i.plan.precio - (i.total_pagado || 0)).toLocaleString('es-CO')}`
              : '-';

            const fechaInicioPlanVal = i.created_at
              ? (() => {
                  const date = new Date(i.created_at);
                  const dd = String(date.getDate()).padStart(2, '0');
                  const mm = String(date.getMonth() + 1).padStart(2, '0');
                  return `${dd}/${mm}/${date.getFullYear()}`;
                })()
              : 'No definida';

            const fechaFinPlanVal = i.fecha_vencimiento
              ? (() => {
                  const date = new Date(i.fecha_vencimiento);
                  const dd = String(date.getDate()).padStart(2, '0');
                  const mm = String(date.getMonth() + 1).padStart(2, '0');
                  return `${dd}/${mm}/${date.getFullYear()}`;
                })()
              : 'No definida';

            const fechaInscripcionVal = i.created_at
              ? (() => {
                  const date = new Date(i.created_at);
                  const dd = String(date.getDate()).padStart(2, '0');
                  const mm = String(date.getMonth() + 1).padStart(2, '0');
                  return `${dd}/${mm}/${date.getFullYear()}`;
                })()
              : '-';

            datosPlanes.push({
              'Nº Alumno': a.numero_alumno,
              'Nombre Completo': a.nombre_completo,
              'Email': a.email,
              'Plan': i.plan?.nombre || 'Sin plan',
              'Precio Plan': precioPlanVal,
              'Clases Incluidas': clasesIncluidasVal,
              'Mes Inicio': i.mes || '-',
              'Año Inicio': i.anio || '-',
              'Estado': i.estado || '-',
              'Clases Usadas': i.clases_usadas || 0,
              'Clases Restantes': clasesIncluidasVal - (i.clases_usadas || 0),
              'Total Pagado': totalPagadoVal,
              'Saldo Pendiente': saldoPendienteVal,
              'Fecha Inicio Plan': fechaInicioPlanVal,
              'Fecha Fin Plan': fechaFinPlanVal,
              'Fecha Inscripción': fechaInscripcionVal,
            });
          });
        } else {
          datosPlanes.push({
            'Nº Alumno': a.numero_alumno,
            'Nombre Completo': a.nombre_completo,
            'Email': a.email,
            'Plan': 'Sin plan activo',
            'Precio Plan': '-',
            'Clases Incluidas': 0,
            'Mes Inicio': '-',
            'Año Inicio': '-',
            'Estado': '-',
            'Clases Usadas': 0,
            'Clases Restantes': 0,
            'Total Pagado': '$0',
            'Saldo Pendiente': '-',
            'Fecha Inicio Plan': '-',
            'Fecha Fin Plan': '-',
            'Fecha Inscripción': '-',
          });
        }
      });

      // Crear workbook con dos hojas
      const wb = XLSX.utils.book_new();

      const ws1 = XLSX.utils.json_to_sheet(datosPersonales);
      const ws2 = XLSX.utils.json_to_sheet(datosPlanes);

      // Ajustar ancho de columnas automáticamente
      const ajustarColumnas = (ws: XLSX.WorkSheet, datos: Record<string, unknown>[]) => {
        const cols = Object.keys(datos[0] || {}).map(key => ({
          wch: Math.max(key.length, ...datos.map(r => String(r[key] || '').length)) + 2
        }));
        ws['!cols'] = cols;
      };

      ajustarColumnas(ws1, datosPersonales);
      ajustarColumnas(ws2, datosPlanes);

      XLSX.utils.book_append_sheet(wb, ws1, 'Información Personal');
      XLSX.utils.book_append_sheet(wb, ws2, 'Planes e Inscripciones');

      // Descargar
      const hoy = new Date();
      const d = String(hoy.getDate()).padStart(2, '0');
      const m = String(hoy.getMonth() + 1).padStart(2, '0');
      const y = hoy.getFullYear();
      const fecha = `${d}-${m}-${y}`;
      XLSX.writeFile(wb, `Club_Travesia_${fecha}.xlsx`);

    } catch (err) {
      console.error('Error exportando:', err);
      alert('Error al generar el Excel. Intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-neon-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-white pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-[1600px] mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b-4 border-white pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-neon-green animate-pulse rounded-full" />
              <span className="font-mono text-[10px] text-neon-green uppercase tracking-[0.3em] font-bold">
                Sistema de Gestión Interna v3.0
              </span>
            </div>
            <h1 className="font-anton text-6xl md:text-8xl uppercase leading-[0.8] tracking-tighter">
              CONTROL<br/>
              <span className="text-white/40">PANEL</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             {/* Botón exportar Excel */}
             <button
                onClick={exportarExcel}
                disabled={exportando}
                style={{
                  background: exportando ? '#333' : '#00ff88',
                  color: '#0a0a0a',
                  border: '3px solid #00ff88',
                  boxShadow: '4px 4px 0 #ff2d78',
                  padding: '12px 24px',
                  fontFamily: 'Anton',
                  fontSize: '14px',
                  letterSpacing: '2px',
                  cursor: exportando ? 'not-allowed' : 'pointer',
                }}
             >
                {exportando ? 'GENERANDO...' : '📊 EXPORTAR EXCEL COMPLETO'}
             </button>

             <div className="text-right hidden md:block">
                <p className="font-mono text-[10px] text-white/40 uppercase">Sesión activa</p>
                <p className="font-mono text-sm text-neon-green font-bold">{user?.email}</p>
             </div>
             <button
                onClick={handleSignOut}
                className="btn-tape px-4 py-2 flex items-center gap-2 text-xs h-fit"
             >
                <LogOut size={14} /> SALIR
             </button>
          </div>
        </header>

        {/* Dashboard Tabs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

          {/* Sidebar Navigation */}
          <aside className="flex flex-col gap-2">
            {[
              { id: 'inscripciones', label: 'Inscripciones', icon: ClipboardList },
              { id: 'asistencia', label: 'Asistencia', icon: Users },
              { id: 'pagos', label: 'Planilla Pagos', icon: CreditCard },
              { id: 'galeria', label: 'Galería Media', icon: ImageIcon },
              { id: 'tienda', label: 'Tienda', icon: ShoppingBag },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`
                  flex items-center gap-4 p-5 font-anton text-xl uppercase tracking-wider transition-all border-l-8
                  ${activeTab === tab.id
                    ? 'bg-white text-black border-neon-green translate-x-2'
                    : 'bg-[#1a1a1a] text-white/40 border-transparent hover:bg-[#222] hover:text-white'}
                `}
              >
                <tab.icon size={24} className={activeTab === tab.id ? 'text-black' : 'text-white/20'} />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Content Area */}
          <main className="bg-[#1a1a1a] border-4 border-white p-6 md:p-10 shadow-brutal-lg min-h-[600px] overflow-x-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'inscripciones' && <InscripcionesTab />}
                {activeTab === 'asistencia' && <AsistenciaTab />}
                {activeTab === 'pagos' && <PagosTab />}
                {activeTab === 'galeria' && <GaleriaTab />}
                {activeTab === 'tienda' && <TiendaTab />}
              </motion.div>
            </AnimatePresence>
          </main>

        </div>
      </div>
    </div>
  );
}
