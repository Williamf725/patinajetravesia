'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alumno, Plan, Inscripcion } from '@/types/database';
import MiPlanTab from './MiPlanTab';
import MiAsistenciaTab from './MiAsistenciaTab';
import MiHistorialTab from './MiHistorialTab';
import { LayoutDashboard, CalendarRange, History, User } from 'lucide-react';
import MiPerfilTab from './MiPerfilTab';

interface Props {
  alumno: Alumno;
  planes: Plan[];
  inscripcionActual: Inscripcion | null;
  historial: Inscripcion[];
}

type Tab = 'plan' | 'asistencia' | 'historial' | 'perfil';

export default function PortalClient({ alumno, planes, inscripcionActual, historial }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('plan');

  const tabs = [
    { id: 'plan', label: 'Mi Plan', icon: LayoutDashboard },
    { id: 'asistencia', label: 'Mi Asistencia', icon: CalendarRange },
    { id: 'historial', label: 'Mi Historial', icon: History },
    { id: 'perfil', label: 'Mi Perfil', icon: User },
  ];

  return (
    <div className="min-h-screen px-6 py-10 md:px-20 md:py-20 max-w-7xl mx-auto">
      {!alumno.perfil_completo && (
        <div style={{ background: '#ff9500', color: '#000', padding: '16px', marginBottom: '24px', border: '3px solid #ff2d78' }}>
          <strong>⚠️ COMPLETA TU PERFIL</strong>
          <p className="text-sm">Necesitamos tu documento y teléfono para el seguro contra accidentes del club. Ve a &quot;Mi Perfil&quot; y completa tu información.</p>
        </div>
      )}

      {/* Header */}
      <header className="mb-12 border-b-4 border-white pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="bg-neon-green text-black font-mono text-[10px] font-bold px-2 py-0.5 inline-block mb-4">
              PORTAL DEL ALUMNO
            </div>
            <h1 className="font-anton text-5xl md:text-7xl text-white uppercase leading-none tracking-tighter">
              HOLA, <span className="text-neon-green">{alumno.nombre_completo.split(' ')[0]}</span>
            </h1>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-white/40 uppercase tracking-widest">Socio Club Travesía</p>
            <p className="font-anton text-2xl text-white">ID #{alumno.numero_alumno}</p>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-4 mb-10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`
                flex items-center gap-3 px-6 py-4 font-anton text-lg uppercase transition-all
                border-2 border-white relative overflow-hidden
                ${isActive ? 'bg-white text-black shadow-brutal translate-x-1 translate-y-1' : 'bg-transparent text-white hover:bg-white/5'}
              `}
            >
              <Icon size={20} />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 h-1 bg-neon-green w-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <main className="min-h-[50vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'plan' && (
              <MiPlanTab
                alumno={alumno}
                planes={planes}
                inscripcionActual={inscripcionActual}
              />
            )}
            {activeTab === 'asistencia' && (
              <MiAsistenciaTab alumnoAutenticadoId={alumno.id} />
            )}
            {activeTab === 'historial' && (
              <MiHistorialTab historial={historial} />
            )}
            {activeTab === 'perfil' && (
              <MiPerfilTab alumno={alumno} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
