'use client';

import React, { useState } from 'react';
import { Plan, Inscripcion, Alumno } from '@/types/database';
import { selectPlan } from '@/app/auth/actions/portal';
import { getSignaturaComprobante, getSignaturaInscripcion } from '@/app/auth/actions/cloudinary';
import { createClient } from '@/lib/supabase/client';
import { Info, CreditCard, Copy } from 'lucide-react';
import { calcularEstadoPlan } from '@/lib/planes';

interface Props {
  alumno: Alumno;
  planes: Plan[];
  inscripcionActual: Inscripcion | null;
}

function SubirComprobantePlan({
  onSubida,
}: {
  inscripcionId?: string;
  onSubida: (url: string) => Promise<void>;
}) {
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
        {subiendo ? 'SUBIENDO...' : 'SUBIR / REEMPLAZAR COMPROBANTE DE PLAN'}
        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} disabled={subiendo} />
      </label>
      {errorLocal && (
        <p className="text-hot-pink font-mono text-[10px] uppercase mt-2">{errorLocal}</p>
      )}
    </div>
  );
}

function SubirComprobanteInscripcion({
  userEmail,
  alumnoId,
  onSubida,
}: {
  userEmail?: string | null;
  alumnoId: string;
  onSubida: () => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const supabase = createClient();

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
      const { signature, timestamp, apiKey, cloudName, folder } = await getSignaturaInscripcion();

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
        const query = supabase.from('alumnos').update({
          comprobante_inscripcion_url: resultado.secure_url,
          comprobante_inscripcion_pendiente: true,
        });

        const { error: updateError } = userEmail
          ? await query.eq('email', userEmail)
          : await query.eq('id', alumnoId);

        if (updateError) throw updateError;
        onSubida();
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
        {subiendo ? 'SUBIENDO...' : 'SUBIR / REEMPLAZAR COMPROBANTE DE INSCRIPCIÓN'}
        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} disabled={subiendo} />
      </label>
      {errorLocal && (
        <p className="text-hot-pink font-mono text-[10px] uppercase mt-2">{errorLocal}</p>
      )}
    </div>
  );
}

export default function MiPlanTab({ alumno, planes, inscripcionActual }: Props) {
  const [planSeleccionado, setPlanSeleccionado] = useState<Plan | null>(null);
  const supabase = createClient();
  const estadoPlan = calcularEstadoPlan(inscripcionActual);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
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

        {/* 1. Nombre del plan siempre visible */}
        {inscripcionActual && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#ff2d78', fontFamily: 'Space Grotesk',
              fontSize: '11px', letterSpacing: '4px', margin: '0 0 4px' }}>
              PLAN ACTUAL
            </p>
            <p style={{ color: '#fff', fontFamily: 'Anton',
              fontSize: '22px', margin: 0, letterSpacing: '1px' }}>
              {inscripcionActual.plan?.nombre.toUpperCase() || ''}
            </p>
          </div>
        )}

        {/* 2. Resumen de clases — visible en todos los estados */}
        {inscripcionActual && (() => {
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
            </>
          );
        })()}

        {/* 4. Banner de alerta si aplica */}
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

        {/* 5. Selección renovar/cambiar plan — SIEMPRE VISIBLE */}
        <div style={{ background: '#111', border: '2px solid #333',
          padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Anton', fontSize: '20px',
            margin: '0 0 20px', letterSpacing: '1px' }}>
            {estadoPlan === 'activo' ? 'CAMBIAR PLAN' : 'RENOVAR PLAN'}
          </h3>
          {/* Grid de planes — siempre cargados y visibles */}
          {planes.map(plan => (
            <button key={plan.id} onClick={() => setPlanSeleccionado(plan)}
              style={{
                background: planSeleccionado?.id === plan.id
                  ? 'rgba(0,255,136,0.1)' : '#0a0a0a',
                border: `2px solid ${planSeleccionado?.id === plan.id ? '#00ff88' : '#333'}`,
                color: '#fff', padding: '16px', cursor: 'pointer', width: '100%',
                fontFamily: 'Space Grotesk', fontSize: '14px', textAlign: 'left',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '8px',
              }}>
              <span>{plan.nombre} — {plan.clases_incluidas} clases</span>
              <span style={{ color: '#00ff88', fontFamily: 'Anton', fontSize: '18px' }}>
                ${plan.precio.toLocaleString('es-CO')}
              </span>
            </button>
          ))}
        </div>

        {/* 6. Comprobante de pago del plan — SIEMPRE VISIBLE */}
        <div style={{ background: '#111', border: '2px solid #333',
          padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Anton', fontSize: '18px',
            margin: '0 0 16px', letterSpacing: '1px' }}>
            COMPROBANTE DE PAGO DEL PLAN
          </h3>

          {/* Mostrar comprobante actual si existe */}
          {inscripcionActual?.comprobante_url && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#555', fontFamily: 'Space Grotesk',
                fontSize: '12px', margin: '0 0 8px' }}>
                Comprobante actual:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inscripcionActual.comprobante_url}
                  alt="Comprobante"
                  style={{ width: '60px', height: '60px', objectFit: 'cover',
                    border: '1px solid #333', borderRadius: '4px' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div>
                  <p style={{ color: inscripcionActual.comprobante_verificado
                    ? '#00ff88' : 'orange',
                    fontFamily: 'Space Grotesk', fontSize: '13px', margin: 0 }}>
                    {inscripcionActual.comprobante_verificado
                      ? '✅ Verificado por el admin'
                      : '⏳ Pendiente de verificación'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botón subir/reemplazar comprobante del plan */}
          <SubirComprobantePlan
            inscripcionId={inscripcionActual?.id}
            onSubida={async (url) => {
              if (inscripcionActual) {
                const { error: updateError } = await supabase
                  .from('inscripciones')
                  .update({
                    comprobante_url: url,
                    comprobante_verificado: false,
                    renovacion_pendiente: planSeleccionado
                      ? true : inscripcionActual.renovacion_pendiente,
                    plan_id: planSeleccionado?.id || inscripcionActual.plan_id,
                  })
                  .eq('id', inscripcionActual.id);
                if (updateError) {
                  alert('Error al guardar comprobante: ' + updateError.message);
                  return;
                }
              } else if (planSeleccionado) {
                await selectPlan(alumno.id, planSeleccionado.id);
              }
              window.location.reload();
            }}
          />
          <p style={{ color: '#555', fontSize: '12px', marginTop: '8px',
            fontFamily: 'Space Grotesk' }}>
            {inscripcionActual?.comprobante_url
              ? 'Sube una foto nueva para reemplazar el comprobante anterior'
              : 'Sube el comprobante de pago de tu plan'}
            {' '}— Formatos: JPG, PNG, WEBP, PDF — Máx 10MB
          </p>
        </div>

        {/* 7. Comprobante de inscripción — SIEMPRE VISIBLE */}
        <div style={{ background: '#111', border: '2px solid #333',
          padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Anton', fontSize: '18px',
            margin: '0 0 16px', letterSpacing: '1px' }}>
            COMPROBANTE DE INSCRIPCIÓN
          </h3>
          <p style={{ color: '#555', fontFamily: 'Space Grotesk',
            fontSize: '13px', margin: '0 0 16px' }}>
            Pago único de{' '}
            <strong style={{ color: '#fff' }}>$20.000 COP</strong>
            {' '}— Nequi a <strong style={{ color: '#fff' }}>@SPA442</strong> — Silvia Peña
          </p>

          {/* Estado actual de inscripción */}
          <div style={{ marginBottom: '16px' }}>
            {alumno.inscripcion_pagada ? (
              <p style={{ color: '#00ff88', fontFamily: 'Space Grotesk',
                fontSize: '13px', margin: 0 }}>
                ✅ Inscripción pagada — Seguro vigente hasta{' '}
                {alumno.fecha_vencimiento_seguro
                  ? new Date(alumno.fecha_vencimiento_seguro + 'T00:00:00')
                      .toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            ) : alumno.comprobante_inscripcion_pendiente ? (
              <p style={{ color: 'orange', fontFamily: 'Space Grotesk',
                fontSize: '13px', margin: 0 }}>
                ⏳ Comprobante enviado — pendiente de verificación
              </p>
            ) : (
              <p style={{ color: '#ff2d78', fontFamily: 'Space Grotesk',
                fontSize: '13px', margin: 0 }}>
                ⚠️ Inscripción no pagada — sube tu comprobante
              </p>
            )}
          </div>

          {/* Comprobante actual si existe */}
          {alumno.comprobante_inscripcion_url && (
            <div style={{ marginBottom: '12px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={alumno.comprobante_inscripcion_url}
                alt="Comprobante inscripción"
                style={{ width: '60px', height: '60px', objectFit: 'cover',
                  border: '1px solid #333', borderRadius: '4px' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}

          {/* Botón subir/reemplazar — siempre visible */}
          <SubirComprobanteInscripcion
            userEmail={alumno.email}
            alumnoId={alumno.id}
            onSubida={() => window.location.reload()}
          />
          <p style={{ color: '#555', fontSize: '12px', marginTop: '8px',
            fontFamily: 'Space Grotesk' }}>
            {alumno.comprobante_inscripcion_url
              ? 'Sube una foto nueva para reemplazar el comprobante anterior'
              : 'Sube el comprobante de tu pago de inscripción'}
            {' '}— Formatos: JPG, PNG, WEBP, PDF — Máx 10MB
          </p>
        </div>
      </section>
    </div>
  );
}
