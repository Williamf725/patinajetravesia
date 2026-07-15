'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alumno, Plan, Inscripcion } from '@/types/database';
import MiPlanTab from './MiPlanTab';
import MiAsistenciaTab from './MiAsistenciaTab';
import MiHistorialTab from './MiHistorialTab';
import { LayoutDashboard, CalendarRange, History, User } from 'lucide-react';
import MiPerfilTab from './MiPerfilTab';
import { toast } from 'sonner';

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

  const formatFechaSeguro = (fechaStr: string | null | undefined) => {
    if (!fechaStr) return 'No registrada';
    try {
      const date = new Date(fechaStr + 'T00:00:00');
      return date.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return fechaStr;
    }
  };

  const isPagada = !!alumno.inscripcion_pagada;
  const fechaVenc = alumno.fecha_vencimiento_seguro;

  let bannerState: 'unpaid' | 'active' | 'expiring' | 'expired' = 'unpaid';

  if (isPagada && fechaVenc) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(fechaVenc + 'T00:00:00');
    venc.setHours(0, 0, 0, 0);

    const diffTime = venc.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      bannerState = 'expired';
    } else if (diffDays <= 30) {
      bannerState = 'expiring';
    } else {
      bannerState = 'active';
    }
  } else {
    bannerState = 'unpaid';
  }

  const handleCopyNequi = () => {
    navigator.clipboard.writeText('@SPA442');
    toast.success('¡Celular/llave Nequi @SPA442 copiado!');
  };

  return (
    <div className="min-h-screen px-6 py-10 md:px-20 md:py-20 max-w-7xl mx-auto">
      {/* Estado del seguro */}
      {bannerState === 'unpaid' && (
        <div className="bg-[#ffcc00] text-black border-4 border-black p-5 mb-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono uppercase text-xs relative overflow-hidden">
          <div className="flex items-start md:items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <strong className="block font-anton text-base tracking-wide">PÓLIZA DE SEGURO INACTIVA</strong>
              <p className="text-black/80 font-bold">Tu póliza de seguro no está activa. Paga tu inscripción de $20.000 COP para activarla.</p>
              <p className="text-black/60 text-[10px] mt-1 font-bold">Paga por Nequi a @SPA442 — A nombre de Silvia Peña</p>
            </div>
          </div>
          <button
            onClick={handleCopyNequi}
            className="self-start md:self-center bg-black text-white hover:bg-white hover:text-black transition-colors px-4 py-2 font-anton text-xs tracking-wider border-2 border-black shrink-0 shadow-inner"
          >
            COPIAR NEQUI
          </button>
        </div>
      )}

      {bannerState === 'active' && (
        <div className="bg-[#00ff88] text-black border-4 border-black p-5 mb-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono uppercase text-xs relative overflow-hidden">
          <div className="flex items-start md:items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <strong className="block font-anton text-base tracking-wide">PÓLIZA ACTIVA</strong>
              <p className="text-black/80 font-bold">Póliza activa con Seguro Mundial — Vence el {formatFechaSeguro(fechaVenc)}</p>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784131243/seguro-mundial_phqk3p.png"
            alt="Seguro Mundial"
            className="h-10 w-auto object-contain shrink-0"
          />
        </div>
      )}

      {bannerState === 'expiring' && (
        <div className="bg-[#ff9500] text-black border-4 border-black p-5 mb-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono uppercase text-xs relative overflow-hidden">
          <div className="flex items-start md:items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <strong className="block font-anton text-base tracking-wide">PÓLIZA POR VENCER</strong>
              <p className="text-black/80 font-bold">Tu póliza vence el {formatFechaSeguro(fechaVenc)}. Renueva tu inscripción pronto.</p>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784131243/seguro-mundial_phqk3p.png"
            alt="Seguro Mundial"
            className="h-10 w-auto object-contain shrink-0"
          />
        </div>
      )}

      {bannerState === 'expired' && (
        <div className="bg-[#ff2d78] text-white border-4 border-black p-5 mb-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono uppercase text-xs relative overflow-hidden">
          <div className="flex items-start md:items-center gap-3">
            <span className="text-2xl">🔴</span>
            <div>
              <strong className="block font-anton text-base tracking-wide text-white">PÓLIZA VENCIDA</strong>
              <p className="text-white/90 font-bold">Tu póliza de seguro venció. Renueva tu inscripción de $20.000 COP para seguir protegido.</p>
              <p className="text-white/70 text-[10px] mt-1 font-bold">Paga por Nequi a @SPA442 — A nombre de Silvia Peña</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 self-start md:self-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784131243/seguro-mundial_phqk3p.png"
              alt="Seguro Mundial"
              className="h-10 w-auto object-contain brightness-0 invert"
            />
            <button
              onClick={handleCopyNequi}
              className="bg-black text-white hover:bg-white hover:text-black transition-colors px-4 py-2 font-anton text-xs tracking-wider border-2 border-white"
            >
              COPIAR NEQUI
            </button>
          </div>
        </div>
      )}

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
