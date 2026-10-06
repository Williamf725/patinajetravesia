'use client';

import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Maximize2, Minimize2, RefreshCw, QrCode as QrIcon } from 'lucide-react';

type RegistroQR = {
  id: string;
  alumno_id: string;
  created_at: string;
  alumnos?: { numero_alumno: number; nombre_completo: string }[] | null;
};

// Fecha de hoy en zona horaria de Bogotá (UTC-5), formato YYYY-MM-DD
const getBogotaToday = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

const MINIMO_PARA_CONFIRMAR = 4;

export default function QRCodeTab() {
  const [url, setUrl] = useState('');
  const [hoy] = useState(getBogotaToday());
  const [registros, setRegistros] = useState<RegistroQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const supabase = createClient();

  const fetchRegistros = useCallback(async () => {
    const { data } = await supabase
      .from('asistencia_qr')
      .select('id, alumno_id, created_at, alumnos(numero_alumno, nombre_completo)')
      .eq('fecha', hoy)
      .order('created_at', { ascending: true });

    setRegistros((data as RegistroQR[]) || []);
    setLoading(false);
  }, [supabase, hoy]);

  useEffect(() => {
    setUrl(`${window.location.origin}/asistencia-qr`);
    fetchRegistros();
    const interval = setInterval(fetchRegistros, 15000); // refresco automático cada 15 s
    return () => clearInterval(interval);
  }, [fetchRegistros]);

  const total = registros.length;
  const confirmada = total >= MINIMO_PARA_CONFIRMAR;

  const estadoClase = confirmada
    ? { texto: 'CLASE CONFIRMADA', clases: 'text-neon-green' }
    : total > 0
      ? { texto: `EN ESPERA (${total}/${MINIMO_PARA_CONFIRMAR}) — se confirma con mínimo ${MINIMO_PARA_CONFIRMAR} en máx. 2 horas`, clases: 'text-yellow-400' }
      : { texto: `SIN REGISTROS — la clase se confirma con mínimo ${MINIMO_PARA_CONFIRMAR} personas en máx. 2 horas`, clases: 'text-white/30' };

  const qrBlock = (
    <div className="flex flex-col items-center gap-6">
      <div className="bg-white p-6 md:p-8 shadow-brutal-lg border-4 border-white">
        {url && <QRCode value={url} size={fullscreen ? 420 : 260} />}
      </div>
      <p className="font-mono text-xs text-white/50 break-all text-center max-w-md">{url}</p>
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon-green text-center">
        El mismo código sirve para todas las clases
      </p>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center gap-6 p-6">
        <h2 className="font-anton text-4xl md:text-6xl uppercase text-center leading-none">
          ESCANEA Y<br /><span className="text-neon-green">REGISTRA TU ASISTENCIA</span>
        </h2>
        {qrBlock}
        <div className="text-center">
          <p className="font-anton text-2xl uppercase">
            {format(parseISO(hoy), 'EEEE d \'de\' MMMM', { locale: es })}
          </p>
          <p className={`font-anton text-xl uppercase mt-2 ${estadoClase.clases}`}>
            {estadoClase.texto}
          </p>
        </div>
        <button
          onClick={() => setFullscreen(false)}
          className="btn-tape px-4 py-2 flex items-center gap-2 text-xs"
        >
          <Minimize2 size={14} /> SALIR DE PANTALLA COMPLETA
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="font-anton text-3xl uppercase flex items-center gap-2">
            <QrIcon className="text-neon-green" /> ASISTENCIA QR
          </h2>
          <p className="font-mono text-xs text-white/40 mt-1">
            Hoy (Bogotá): <span className="text-white/70">{format(parseISO(hoy), 'EEEE d \'de\' MMMM yyyy', { locale: es })}</span>
            {' — '}
            <span className={estadoClase.clases}>{estadoClase.texto}</span>
          </p>
        </div>
        <button
          onClick={() => setFullscreen(true)}
          className="btn-tape px-4 py-2 flex items-center gap-2 text-xs"
        >
          <Maximize2 size={14} /> PANTALLA COMPLETA
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-start">
        {/* QR */}
        <div className="justify-self-center lg:justify-self-start">{qrBlock}</div>

        {/* Registros de hoy */}
        <div className="bg-[#1a1a1a] border-4 border-white shadow-brutal overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-black border-b-4 border-white">
            <h3 className="font-anton text-xl uppercase">
              Registrados hoy <span className="text-neon-green">({total})</span>
            </h3>
            <button
              onClick={fetchRegistros}
              className="text-white/40 hover:text-neon-green transition-colors"
              title="Actualizar"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center font-mono text-xs text-white/40 animate-pulse">Cargando...</p>
            ) : total === 0 ? (
              <p className="p-6 text-center font-mono text-xs text-white/40 uppercase">
                Nadie se ha registrado todavía
              </p>
            ) : (
              <table className="w-full font-mono text-xs border-collapse">
                <tbody>
                  {registros.map((r, i) => (
                    <tr key={r.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="p-3 text-neon-green font-bold w-12">{i + 1}</td>
                      <td className="p-3 text-white/40 w-16">#{r.alumnos?.[0]?.numero_alumno}</td>
                      <td className="p-3 uppercase">{r.alumnos?.[0]?.nombre_completo}</td>
                      <td className="p-3 text-white/30 text-right">
                        {r.created_at ? format(new Date(r.created_at), 'hh:mm a') : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {total > 0 && !confirmada && (
            <p className="p-3 font-mono text-[10px] text-yellow-400 uppercase border-t border-white/10">
              Faltan {MINIMO_PARA_CONFIRMAR - total} registro{MINIMO_PARA_CONFIRMAR - total !== 1 ? 's' : ''} para confirmar la clase (máx. 2 horas desde el primer registro)
            </p>
          )}
          {confirmada && (
            <p className="p-3 font-mono text-[10px] text-neon-green uppercase border-t border-white/10">
              Clase confirmada — los registros ya quedaron en la planilla de asistencia
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
