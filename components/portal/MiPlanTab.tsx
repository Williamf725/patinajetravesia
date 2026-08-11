'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plan, Inscripcion, Alumno } from '@/types/database';
import { selectPlan, cambiarPlan, guardarRenovacion } from '@/app/auth/actions/portal';
import { getSignaturaComprobante } from '@/app/auth/actions/cloudinary';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, Clock, XCircle, Info, CreditCard, Copy, Upload } from 'lucide-react';
import { calcularEstadoPlan } from '@/lib/planes';

interface Props {
  alumno: Alumno;
  planes: Plan[];
  inscripcionActual: Inscripcion | null;
}

interface SubirComprobanteProps {
  onSubida: (url: string) => Promise<void>;
}

function SubirComprobante({ onSubida }: SubirComprobanteProps) {
  const [subiendo, setSubiendo] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorLocal(null);
    const formatosValidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

    if (!formatosValidos.includes(file.type)) {
      setErrorLocal('Formato no válido. Usa JPG, PNG, WEBP, GIF o PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorLocal('El archivo no puede superar 10MB');
      return;
    }

    setSubiendo(true);
    try {
      const { signature, timestamp, apiKey, cloudName, folder } = await getSignaturaComprobante();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: 'POST', body: formData }
      );

      const resultado = await response.json();
      if (!response.ok) throw new Error(resultado.error?.message || 'Error al subir');

      if (resultado.secure_url) {
        await onSubida(resultado.secure_url);
      }
    } catch (err) {
      console.error(err);
      setErrorLocal(err instanceof Error ? err.message : 'Error al subir comprobante');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div>
      <label className="btn-tape text-xs py-3 cursor-pointer inline-flex items-center gap-2">
        {subiendo ? 'SUBIENDO...' : 'SUBIR COMPROBANTE'}
        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} disabled={subiendo} />
      </label>
      {errorLocal && (
        <p className="text-hot-pink font-mono text-[10px] uppercase mt-2">{errorLocal}</p>
      )}
    </div>
  );
}

export default function MiPlanTab({ alumno, planes, inscripcionActual }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPlanChange, setShowPlanChange] = useState(false);
  const [uploadingComprobante, setUploadingComprobante] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planRenovacion, setPlanRenovacion] = useState<Plan | null>(null);
  const [showRenewalSection, setShowRenewalSection] = useState(false);

  const supabase = createClient();
  const estadoPlan = calcularEstadoPlan(inscripcionActual);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
  };

  const handleSelectPlan = async (plan: Plan) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await selectPlan(alumno.id, plan.id);
      const msg = `Hola, acabo de escoger el plan *${plan.nombre}* en el portal. Mi nombre es *${alumno.nombre_completo}*.`;
      window.open(`https://wa.me/573222508676?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al seleccionar plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'aprobado': return <CheckCircle2 className="text-neon-green" size={48} />;
      case 'pendiente': return <Clock className="text-yellow-400" size={48} />;
      case 'rechazado': return <XCircle className="text-hot-pink" size={48} />;
      default: return null;
    }
  };

  const handleUploadComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !inscripcionActual) return;

    setError(null);
    const formatosValidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

    if (!formatosValidos.includes(file.type)) {
      setError('Formato no válido. Usa JPG, PNG, WEBP, GIF o PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar 10MB');
      return;
    }

    setUploadingComprobante(true);
    try {
      const { signature, timestamp, apiKey, cloudName, folder } = await getSignaturaComprobante();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: 'POST', body: formData }
      );

      const resultado = await response.json();
      if (!response.ok) throw new Error(resultado.error?.message || 'Error al subir');

      if (resultado.secure_url) {
        const { error: updateError } = await supabase
          .from('inscripciones')
          .update({
            comprobante_url: resultado.secure_url,
            estado: 'pendiente',
            comprobante_verificado: false
          })
          .eq('id', inscripcionActual.id);

        if (updateError) throw updateError;
        alert('Comprobante subido con éxito');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error al subir comprobante');
    } finally {
      setUploadingComprobante(false);
    }
  };

  const handleChangePlan = async (plan: Plan) => {
    if (!inscripcionActual) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await cambiarPlan(inscripcionActual.id, plan.id);
      setShowPlanChange(false);
      alert('Plan actualizado con éxito');
      window.location.reload();
    } catch {
      setError('Error al cambiar plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Datos de Pago Fijos */}
      <section className="bg-neon-green p-6 border-4 border-black shadow-brutal flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
           <CreditCard size={40} className="text-black" />
           <div>
              <h2 className="font-anton text-2xl text-black uppercase leading-none">Datos de Pago</h2>
              <p className="font-mono text-[10px] text-black/60 uppercase font-bold">Nequi / Bold</p>
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
           <div className="text-center md:text-right">
              <p className="font-anton text-3xl text-black leading-none">@SPA442</p>
              <p className="font-mono text-[10px] text-black uppercase">Silvia Peña</p>
           </div>
           <button
            onClick={() => copyToClipboard('@SPA442')}
            className="bg-black text-white p-3 hover:scale-110 active:scale-95 transition-transform"
           >
              <Copy size={20} />
           </button>
        </div>
      </section>

      {/* Current Subscription Status */}
      <section>
        <h2 className="font-anton text-3xl uppercase mb-6 flex items-center gap-2">
          <Info className="text-neon-green" /> ESTADO DE MI PLAN
        </h2>

        {inscripcionActual ? (
          <>
            {/* 4. Nombre del plan siempre visible */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#ff2d78', fontFamily: 'Space Grotesk',
                fontSize: '11px', letterSpacing: '4px', margin: '0 0 4px' }}>
                PLAN ACTUAL
              </p>
              <p style={{ color: '#fff', fontFamily: 'Anton',
                fontSize: '22px', margin: 0, letterSpacing: '1px' }}>
                {inscripcionActual.plan?.nombre?.toUpperCase() || ''}
              </p>
            </div>

            {/* 2. Agregar resumen visual de clases en todos los estados */}
            {(() => {
              const restantes = (inscripcionActual.plan?.clases_incluidas || 0) - (inscripcionActual.clases_usadas || 0);
              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '2px', marginBottom: '24px' }}>

                    {/* Clases pagadas */}
                    <div style={{ background: '#111', padding: '20px 16px', textAlign: 'center' }}>
                      <p style={{ color: '#555', fontFamily: 'Space Grotesk',
                        fontSize: '11px', letterSpacing: '3px', margin: '0 0 8px' }}>
                        PAGADAS
                      </p>
                      <p style={{ color: '#fff', fontFamily: 'Anton',
                        fontSize: '40px', margin: '0 0 4px', lineHeight: 1 }}>
                        {inscripcionActual.plan?.clases_incluidas || 0}
                      </p>
                      <p style={{ color: '#555', fontFamily: 'Space Grotesk',
                        fontSize: '12px', margin: 0 }}>
                        clases
                      </p>
                    </div>

                    {/* Clases asistidas/usadas */}
                    <div style={{ background: '#111', padding: '20px 16px', textAlign: 'center',
                      borderLeft: '2px solid #0a0a0a', borderRight: '2px solid #0a0a0a' }}>
                      <p style={{ color: '#555', fontFamily: 'Space Grotesk',
                        fontSize: '11px', letterSpacing: '3px', margin: '0 0 8px' }}>
                        ASISTIDAS
                      </p>
                      <p style={{ color: '#00ff88', fontFamily: 'Anton',
                        fontSize: '40px', margin: '0 0 4px', lineHeight: 1 }}>
                        {inscripcionActual.clases_usadas}
                      </p>
                      <p style={{ color: '#555', fontFamily: 'Space Grotesk',
                        fontSize: '12px', margin: 0 }}>
                        clases
                      </p>
                    </div>

                    {/* Clases restantes */}
                    <div style={{ background: '#111', padding: '20px 16px', textAlign: 'center' }}>
                      <p style={{ color: '#555', fontFamily: 'Space Grotesk',
                        fontSize: '11px', letterSpacing: '3px', margin: '0 0 8px' }}>
                        RESTANTES
                      </p>
                      <p style={{
                        color: restantes <= 0 ? '#ff2d78' : restantes === 1 ? 'orange' : '#fff',
                        fontFamily: 'Anton', fontSize: '40px', margin: '0 0 4px', lineHeight: 1
                      }}>
                        {Math.max(0, restantes)}
                      </p>
                      <p style={{ color: '#555', fontFamily: 'Space Grotesk',
                        fontSize: '12px', margin: 0 }}>
                        clases
                      </p>
                    </div>
                  </div>

                  {/* 3. Barra de progreso visual debajo de las 3 estadísticas */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ background: '#1a1a1a', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, (inscripcionActual.clases_usadas / (inscripcionActual.plan?.clases_incluidas || 1)) * 100)}%`,
                        background: restantes <= 0 ? '#ff2d78' : restantes === 1 ? 'orange' : '#00ff88',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      marginTop: '6px' }}>
                      <span style={{ color: '#555', fontFamily: 'Space Grotesk', fontSize: '12px' }}>
                        0
                      </span>
                      <span style={{ color: '#555', fontFamily: 'Space Grotesk', fontSize: '12px' }}>
                        {inscripcionActual.plan?.clases_incluidas || 0} clases
                      </span>
                    </div>
                  </div>

                  {/* Botones permanentes para cambiar o renovar plan */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setShowPlanChange(!showPlanChange)}
                      style={{
                        background: showPlanChange ? '#ff2d78' : '#111',
                        color: '#fff',
                        border: `2px solid ${showPlanChange ? '#ff2d78' : '#333'}`,
                        fontFamily: 'Anton',
                        fontSize: '14px',
                        padding: '12px 24px',
                        cursor: 'pointer',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {showPlanChange ? 'Ocultar Cambiar Plan' : 'Cambiar de Plan'}
                    </button>
                    <button
                      onClick={() => setShowRenewalSection(!showRenewalSection)}
                      style={{
                        background: showRenewalSection ? '#00ff88' : '#111',
                        color: showRenewalSection ? '#000' : '#fff',
                        border: `2px solid ${showRenewalSection ? '#00ff88' : '#333'}`,
                        fontFamily: 'Anton',
                        fontSize: '14px',
                        padding: '12px 24px',
                        cursor: 'pointer',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {showRenewalSection ? 'Ocultar Renovación' : 'Renovar mi Plan'}
                    </button>
                  </div>
                </>
              );
            })()}

            {/* Banners de alerta si aplica */}
            {estadoPlan === 'pocas_clases' && (
              <div style={{ background: 'rgba(255,165,0,0.1)', border: '3px solid orange',
                padding: '20px', marginBottom: '24px' }}>
                <p style={{ color: 'orange', fontFamily: 'Anton', fontSize: '20px', margin: '0 0 8px' }}>
                  ⚡ TE QUEDA 1 SOLA CLASE
                </p>
                <p style={{ color: '#aaa', fontFamily: 'Space Grotesk', fontSize: '14px', margin: 0 }}>
                  Renueva tu plan para seguir patinando sin interrupciones.
                </p>
              </div>
            )}

            {estadoPlan === 'agotado' && (
              <div style={{ background: 'rgba(255,45,120,0.1)', border: '3px solid #ff2d78',
                padding: '20px', marginBottom: '24px' }}>
                <p style={{ color: '#ff2d78', fontFamily: 'Anton', fontSize: '20px', margin: '0 0 8px' }}>
                  🔴 TUS CLASES SE AGOTARON
                </p>
                <p style={{ color: '#aaa', fontFamily: 'Space Grotesk', fontSize: '14px', margin: 0 }}>
                  Has usado todas tus clases de este plan. Renueva para continuar.
                </p>
              </div>
            )}

            {estadoPlan === 'renovacion_pendiente' && (
              <div style={{ background: 'rgba(0,255,136,0.05)', border: '2px solid #00ff88',
                padding: '20px', marginBottom: '24px' }}>
                <p style={{ color: '#00ff88', fontFamily: 'Anton', fontSize: '20px', margin: '0 0 8px' }}>
                  ⏳ RENOVACIÓN EN PROCESO
                </p>
                <p style={{ color: '#aaa', fontFamily: 'Space Grotesk', fontSize: '14px', margin: 0 }}>
                  Tu comprobante fue enviado. El admin confirmará tu renovación pronto.
                </p>
              </div>
            )}

            {/* Sección renovación si aplica */}
            {(estadoPlan === 'agotado' || estadoPlan === 'pocas_clases' || showRenewalSection) && (
              <div style={{ background: '#111', border: '2px solid #333', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ color: '#fff', fontFamily: 'Anton', fontSize: '22px',
                  margin: '0 0 20px', letterSpacing: '1px' }}>
                  RENOVAR MI PLAN
                </h3>

                {/* Selector de planes */}
                <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                  {planes.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => setPlanRenovacion(plan)}
                      style={{
                        background: planRenovacion?.id === plan.id ? 'rgba(0,255,136,0.1)' : '#0a0a0a',
                        border: `2px solid ${planRenovacion?.id === plan.id ? '#00ff88' : '#333'}`,
                        color: '#fff', padding: '16px', cursor: 'pointer',
                        fontFamily: 'Space Grotesk', fontSize: '14px', textAlign: 'left',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        width: '100%',
                      }}>
                      <span>{plan.nombre} — {plan.clases_incluidas} clases</span>
                      <span style={{ color: '#00ff88', fontFamily: 'Anton', fontSize: '18px' }}>
                        ${plan.precio.toLocaleString('es-CO')}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Datos de pago */}
                {planRenovacion && (
                  <div style={{ background: '#0a0a0a', border: '1px solid #333',
                    padding: '16px', marginBottom: '20px' }}>
                    <p style={{ color: '#aaa', fontFamily: 'Space Grotesk',
                      fontSize: '13px', margin: '0 0 8px' }}>
                      Paga por Nequi a <strong style={{ color: '#fff' }}>@SPA442</strong> — A nombre de Silvia Peña
                    </p>
                    <p style={{ color: '#00ff88', fontFamily: 'Anton', fontSize: '24px', margin: 0 }}>
                      ${planRenovacion.precio.toLocaleString('es-CO')} COP
                    </p>
                  </div>
                )}

                {/* Subida de comprobante de renovación */}
                {planRenovacion && (
                  <div>
                    <p style={{ color: '#aaa', fontFamily: 'Space Grotesk',
                      fontSize: '13px', margin: '0 0 12px' }}>
                      Sube el comprobante de pago para renovar tu plan:
                    </p>
                    <SubirComprobante
                      onSubida={async (url) => {
                        const res = await guardarRenovacion({
                          inscripcionId: inscripcionActual.id,
                          nuevoPlanId: planRenovacion.id,
                          comprobanteUrl: url,
                        });
                        if (res && 'success' in res && res.success) {
                          alert('Plan renovado con éxito');
                          window.location.reload();
                        } else {
                          alert('Error: ' + (res && 'error' in res ? res.error : 'Error al guardar renovación'));
                        }
                      }}
                    />
                    <p style={{ color: '#555', fontSize: '12px', marginTop: '8px',
                      fontFamily: 'Space Grotesk' }}>
                      Formatos: JPG, PNG, WEBP, PDF — Máx 10MB
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Resumen del plan activo SOLO si estado es activo */}
            {estadoPlan === 'activo' && (
              <div style={{ background: '#111', border: '2px solid #333',
                padding: '24px', marginBottom: '24px' }}>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    {getStatusIcon(inscripcionActual.estado)}
                  </div>
                  <div className="flex-grow text-center md:text-left">
                    <h3 className="font-anton text-4xl uppercase mb-1">
                      {inscripcionActual.plan?.nombre}
                    </h3>
                    <p className="font-mono text-xs text-white/60 uppercase tracking-widest mb-4">
                      Periodo: {inscripcionActual.mes} {inscripcionActual.anio}
                    </p>

                    {inscripcionActual.estado === 'pendiente' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-yellow-400/10 border-l-4 border-yellow-400 text-yellow-400 font-mono text-sm uppercase">
                          Tu solicitud fue enviada. El admin confirmará tu acceso pronto.
                        </div>
                        <button
                          onClick={() => {
                            const msg = `Hola, mi pago para el plan *${inscripcionActual.plan?.nombre}* está pendiente. Mi nombre es *${alumno.nombre_completo}*.`;
                            window.open(`https://wa.me/573222508676?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="btn-tape w-full py-3 text-sm"
                        >
                          INFORMAR PAGO POR WHATSAPP
                        </button>
                      </div>
                    )}

                    <div className="mt-8 border-t border-white/10 pt-6">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        {/* Comprobante Section */}
                        <div className="flex-1 space-y-4">
                          <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-2">
                            <Upload size={12} /> Comprobante de Pago
                          </p>

                          {inscripcionActual.comprobante_url ? (
                            <div className="flex items-center gap-4">
                              <div className="relative w-20 h-20 border-2 border-white/20 overflow-hidden">
                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                 <img src={inscripcionActual.comprobante_url} alt="Comprobante" className="object-cover w-full h-full" />
                              </div>
                              <div className="space-y-2 text-left">
                                <p className={`font-anton text-xs uppercase ${inscripcionActual.comprobante_verificado ? 'text-neon-green' : 'text-yellow-400'}`}>
                                  {inscripcionActual.comprobante_verificado ? '✅ Pago Verificado' : 'Comprobante enviado — pendiente de verificación'}
                                </p>
                                {!inscripcionActual.comprobante_verificado && (
                                  <label className="text-[10px] text-white/60 underline cursor-pointer hover:text-white uppercase font-mono">
                                    Reemplazar
                                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUploadComprobante} disabled={uploadingComprobante} />
                                  </label>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4 text-left">
                              <p className="font-anton text-xs text-white/20 uppercase">Sin comprobante</p>
                              <label className="btn-tape text-xs py-3 cursor-pointer inline-flex items-center gap-2">
                                {uploadingComprobante ? 'SUBIENDO...' : 'SUBIR COMPROBANTE'}
                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUploadComprobante} disabled={uploadingComprobante} />
                              </label>
                              <p className="font-mono text-[9px] text-white/40 uppercase">
                                Formatos aceptados: JPG, PNG, WEBP, GIF, PDF — Máximo 10MB
                              </p>
                            </div>
                          )}
                          {error && (
                            <p className="text-hot-pink font-mono text-[10px] uppercase">{error}</p>
                          )}
                        </div>

                        {/* Class Summary for all states */}
                        <div className="flex-1 text-right space-y-2">
                          <p className="font-mono text-[10px] text-white/40 uppercase">Vencimiento</p>
                          <p className="font-anton text-xl text-white">
                            {inscripcionActual.fecha_vencimiento ? new Date(inscripcionActual.fecha_vencimiento).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {inscripcionActual.estado === 'rechazado' && (
                      <div className="p-4 bg-hot-pink/10 border-l-4 border-hot-pink text-hot-pink font-mono text-sm uppercase">
                        Pago rechazado. Contacta al admin por WhatsApp.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-[#1a1a1a] border-4 border-dashed border-white/20 p-8 text-center">
            <p className="font-mono text-sm text-white/40 uppercase tracking-widest">
              No tienes un plan activo para este mes. Selecciona uno abajo.
            </p>
          </div>
        )}
      </section>

      {/* Available Plans / Change Plan */}
      {(!inscripcionActual || showPlanChange) && (
        <section className="mt-20">
          <h2 className="font-anton text-3xl uppercase mb-6">
            {showPlanChange ? 'ESCOGE TU NUEVO PLAN' : 'PLANES DISPONIBLES'}
          </h2>
          {error && (
            <p className="text-hot-pink font-mono text-[10px] uppercase mb-4">{error}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {planes.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#131313] border-4 border-white p-6 shadow-brutal-lg flex flex-col justify-between"
              >
                <div>
                  <div className="font-mono text-[10px] text-neon-green uppercase mb-2 font-bold tracking-widest">
                    {plan.clases_incluidas === 1 ? 'Individual' : 'Mensual'}
                  </div>
                  <h3 className="font-anton text-3xl uppercase mb-4 leading-none">{plan.nombre}</h3>
                  <div className="font-anton text-5xl text-white mb-6">
                    ${plan.precio.toLocaleString()}
                  </div>
                  <ul className="space-y-2 mb-8 font-mono text-[10px] uppercase text-white/60">
                    <li className="flex items-center gap-2">
                      <span className="text-neon-green">⚡</span> {plan.clases_incluidas} {plan.clases_incluidas === 1 ? 'clase' : 'clases'} al mes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-neon-green">⚡</span> Acceso a todos los horarios
                    </li>
                  </ul>
                </div>

                <button
                  disabled={isSubmitting}
                  onClick={() => showPlanChange ? handleChangePlan(plan) : handleSelectPlan(plan)}
                  className="btn-tape w-full py-3 font-anton uppercase text-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Procesando...' : (showPlanChange ? 'Confirmar Cambio' : 'Escoger Plan')}
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
