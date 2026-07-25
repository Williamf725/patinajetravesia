'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alumno, Plan, Inscripcion } from '@/types/database';
import MiPlanTab from './MiPlanTab';
import MiAsistenciaTab from './MiAsistenciaTab';
import MiHistorialTab from './MiHistorialTab';
import { LayoutDashboard, CalendarRange, History, User, Copy, Upload } from 'lucide-react';
import MiPerfilTab from './MiPerfilTab';
import { toast } from 'sonner';
import { getSignaturaInscripcion } from '@/app/auth/actions/cloudinary';
import { selectPlan } from '@/app/auth/actions/portal';
import { createClient } from '@/lib/supabase/client';

interface Props {
  userEmail?: string | null;
  alumno: Alumno;
  planes: Plan[];
  inscripcionActual: Inscripcion | null;
  historial: Inscripcion[];
}

type Tab = 'plan' | 'asistencia' | 'historial' | 'perfil';

export default function PortalClient({ userEmail, alumno, planes, inscripcionActual, historial }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [tipoPago, setTipoPago] = useState<'solo_inscripcion' | 'inscripcion_y_plan'>('solo_inscripcion');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [uploadingInscripcion, setUploadingInscripcion] = useState(false);
  const [progreso, setProgreso] = useState<number>(0);
  const [errorInscripcion, setErrorInscripcion] = useState<string | null>(null);

  const supabase = createClient();

  const tabs = [
    { id: 'plan', label: 'Mi Plan', icon: LayoutDashboard },
    { id: 'asistencia', label: 'Mi Asistencia', icon: CalendarRange },
    { id: 'historial', label: 'Mi Historial', icon: History },
    { id: 'perfil', label: 'Mi Perfil', icon: User },
  ];

  const handleUploadInscripcionComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorInscripcion(null);
    const formatosValidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

    if (!formatosValidos.includes(file.type)) {
      setErrorInscripcion('Formato no válido. Usa JPG, PNG, WEBP, GIF o PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorInscripcion('El archivo no puede superar 10MB');
      return;
    }

    if (tipoPago === 'inscripcion_y_plan' && !selectedPlanId) {
      setErrorInscripcion('Por favor selecciona un plan mensual para proceder.');
      return;
    }

    setUploadingInscripcion(true);
    setProgreso(0);
    try {
      const { signature, timestamp, apiKey, cloudName, folder } = await getSignaturaInscripcion();

      const resultado = await new Promise<{ secure_url?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', folder);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgreso(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error('Respuesta inválida de Cloudinary'));
            }
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData.error?.message || 'Error al subir a Cloudinary'));
            } catch {
              reject(new Error('Error de conexión con Cloudinary'));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('Error de red al subir a Cloudinary'));
        };

        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
        xhr.send(formData);
      });

      if (resultado && resultado.secure_url) {
        // If they chose plan, enroll them in the plan too!
        if (tipoPago === 'inscripcion_y_plan' && selectedPlanId) {
          try {
            await selectPlan(alumno.id, selectedPlanId);
          } catch (err) {
            console.warn("Select plan error (may already exist):", err);
          }
        }

        // Save to alumnos table using browser client matching the query logic
        const targetEmail = userEmail || alumno.email;
        const query = supabase.from('alumnos').update({
          comprobante_inscripcion_url: resultado.secure_url,
          comprobante_inscripcion_pendiente: true,
          tipo_pago_inscripcion: tipoPago,
          plan_inscripcion_id: tipoPago === 'inscripcion_y_plan' ? selectedPlanId : null
        });

        const { error: updateError } = targetEmail
          ? await query.eq('email', targetEmail)
          : await query.eq('id', alumno.id);

        if (updateError) throw updateError;

        toast.success('Comprobante de inscripción subido con éxito');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setErrorInscripcion(err instanceof Error ? err.message : 'Error al subir comprobante');
    } finally {
      setUploadingInscripcion(false);
    }
  };

  const formatFechaSeguro = (fechaStr: string | null | undefined) => {
    if (!fechaStr) return 'No registrada';
    try {
      const date = new Date(fechaStr + 'T00:00:00');
      const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
    } catch {
      return fechaStr;
    }
  };

  const isPagada = !!alumno.inscripcion_pagada;
  const isPendienteVerificacion = !!alumno.comprobante_inscripcion_pendiente;
  const fechaVenc = alumno.fecha_vencimiento_seguro;

  let bannerState: 'unpaid' | 'active' | 'expiring' | 'expired' | 'pending_verification' = 'unpaid';

  if (isPendienteVerificacion) {
    bannerState = 'pending_verification';
  } else if (isPagada && fechaVenc) {
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
      {bannerState === 'pending_verification' && (
        <div className="bg-[#0066ff] text-white border-4 border-black p-5 mb-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono uppercase text-xs relative overflow-hidden">
          <div className="flex items-start md:items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <strong className="block font-anton text-base tracking-wide text-white">COMPROBANTE EN REVISIÓN</strong>
              <p className="text-white/90 font-bold">Comprobante de inscripción enviado — pendiente de verificación por el admin</p>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784131243/seguro-mundial_phqk3p.png"
            alt="Seguro Mundial"
            className="h-10 w-auto object-contain shrink-0 brightness-0 invert"
          />
        </div>
      )}

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

      {/* Sección pago inscripción - solo si no ha pagado */}
      {!alumno.inscripcion_pagada && (
        <section className="bg-black border-4 border-neon-green p-6 md:p-8 mb-8 shadow-brutal flex flex-col gap-6 relative text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="font-anton text-3xl uppercase leading-none text-white tracking-tight">
                ACTIVA TU PÓLIZA DE SEGURO
              </h2>
              <p className="font-anton text-xl text-neon-green mt-1">
                $20.000 COP <span className="font-mono text-[10px] text-white/60 font-bold uppercase tracking-widest">(ÚNICA VEZ, VIGENCIA 1 AÑO)</span>
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784131243/seguro-mundial_phqk3p.png"
              alt="Seguro Mundial"
              className="h-10 w-auto object-contain shrink-0"
            />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 border border-white/10 font-mono text-xs uppercase">
            <div>
              <p className="text-white/40">Datos de Pago Nequi:</p>
              <strong className="text-white">Nequi a @SPA442 — A nombre de Silvia Peña</strong>
            </div>
            <button
              onClick={handleCopyNequi}
              className="bg-neon-green text-black hover:scale-105 active:scale-95 transition-transform px-4 py-2 font-anton text-xs flex items-center gap-2"
            >
              <Copy size={12} /> COPIAR NEQUI
            </button>
          </div>

          {!alumno.comprobante_inscripcion_pendiente ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-1 w-full max-w-sm">
                <label className="font-mono text-[10px] text-white/40 uppercase">¿Qué deseas pagar hoy?</label>
                <select
                  name="tipoPago"
                  value={tipoPago}
                  onChange={(e) => setTipoPago(e.target.value as 'solo_inscripcion' | 'inscripcion_y_plan')}
                  className="bg-black border border-white/20 p-2.5 text-xs text-white font-mono outline-none focus:border-neon-green cursor-pointer"
                >
                  <option value="solo_inscripcion">Solo inscripción — $20.000</option>
                  <option value="inscripcion_y_plan">Inscripción + Plan mensual</option>
                </select>
              </div>

              {tipoPago === 'inscripcion_y_plan' && (
                <div className="space-y-4">
                  <p className="font-mono text-[10px] text-neon-green uppercase font-bold tracking-wider">Selecciona tu Plan Mensual:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {planes.map(plan => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`cursor-pointer p-4 border-2 transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-neon-green text-black border-black shadow-brutal translate-x-1 translate-y-1'
                              : 'bg-black/40 text-white border-white/20 hover:border-white/40 hover:bg-white/5'
                          }`}
                        >
                          <div>
                            <h4 className="font-anton text-lg uppercase leading-none mb-1">{plan.nombre}</h4>
                            <p className="font-anton text-xl">${plan.precio.toLocaleString()}</p>
                          </div>
                          <p className="font-mono text-[8px] opacity-60 uppercase mt-4 font-bold">{plan.clases_incluidas} clases / mes</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-white/20 p-6 text-center space-y-4">
                <p className="font-mono text-xs text-white/60 uppercase tracking-widest">SUBE TU COMPROBANTE DE PAGO AQUÍ</p>
                <label className="btn-tape text-xs py-3 px-6 cursor-pointer inline-flex items-center gap-2">
                  <Upload size={14} /> {uploadingInscripcion ? `SUBIENDO... ${progreso}%` : 'SELECCIONAR COMPROBANTE'}
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUploadInscripcionComprobante} disabled={uploadingInscripcion} />
                </label>
                <p className="font-mono text-[9px] text-white/40 uppercase block">
                  Formatos aceptados: JPG, PNG, WEBP, GIF, PDF — Máximo 10MB
                </p>
                {uploadingInscripcion && (
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-4 border border-white/20">
                    <div className="h-full bg-neon-green transition-all duration-300" style={{ width: `${progreso}%` }} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border-2 border-neon-green p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                {alumno.comprobante_inscripcion_url && (
                  <div className="relative w-20 h-20 border-2 border-white/20 overflow-hidden shrink-0 bg-black/40 shadow-brutal">
                    {alumno.comprobante_inscripcion_url.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/40 font-mono text-[8px] uppercase">
                        <span className="text-xl">📄</span>
                        PDF DOC
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={alumno.comprobante_inscripcion_url} alt="Comprobante Inscripción" className="object-cover w-full h-full" />
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="font-anton text-neon-green text-sm uppercase">✅ Comprobante enviado. El admin verificará tu pago y activará tu póliza pronto.</p>
                  <p className="font-mono text-[10px] text-white/60">¿Deseas avisar al administrador? Utiliza el botón de WhatsApp abajo para notificarlo directamente:</p>

                  {/* WhatsApp Button */}
                  <a
                    href={`https://wa.me/573202027777?text=${encodeURIComponent(
                      `Hola, soy ${alumno.nombre_completo} y acabo de subir el comprobante de mi inscripción al Club Travesía. Mi correo es ${alumno.email}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#25D366] text-black hover:brightness-110 transition-all font-anton text-xs uppercase px-4 py-2 mt-2 inline-flex items-center gap-2"
                  >
                    AVISAR AL ADMIN POR WHATSAPP
                  </a>
                </div>
              </div>

              {/* Replace option if pending */}
              <label className="bg-black text-white hover:bg-white hover:text-black transition-colors px-4 py-2 font-anton text-xs border-2 border-white cursor-pointer shrink-0 uppercase tracking-widest">
                {uploadingInscripcion ? `SUBIENDO... ${progreso}%` : 'REEMPLAZAR COMPROBANTE'}
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUploadInscripcionComprobante} disabled={uploadingInscripcion} />
              </label>
            </div>
          )}

          {errorInscripcion && (
            <p className="text-hot-pink font-mono text-[10px] uppercase text-center mt-2">{errorInscripcion}</p>
          )}
        </section>
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
