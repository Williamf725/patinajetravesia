'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { QrCode, Search, CheckCircle2, XCircle, UserRound } from 'lucide-react';

type AlumnoQR = { id: string; nombre_completo: string; numero_alumno: number };

type Resultado = {
  ok: boolean;
  mensaje?: string;
  error?: string;
  nombre?: string;
  fecha?: string;
  registrados_hoy?: number;
  clase_confirmada?: boolean;
} | null;

const getBogotaToday = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

export default function AsistenciaQRPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [alumnos, setAlumnos] = useState<AlumnoQR[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<AlumnoQR | null>(null);
  const [resultado, setResultado] = useState<Resultado>(null);
  const [enviando, setEnviando] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const hoy = getBogotaToday();

  const cargarAlumnos = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase.rpc('obtener_alumnos_qr');
    if (error) {
      setLoadError(true);
      setAlumnos([]);
    } else {
      setAlumnos(((data as AlumnoQR[]) || []).sort((a, b) =>
        a.nombre_completo.localeCompare(b.nombre_completo, 'es')
      ));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    cargarAlumnos();
  }, [cargarAlumnos]);

  const normalizar = (texto: string) =>
    texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (!q) return alumnos;
    return alumnos.filter(a =>
      normalizar(a.nombre_completo).includes(q) ||
      String(a.numero_alumno).includes(q)
    );
  }, [alumnos, busqueda]);

  const registrar = async (alumnoId: string) => {
    setEnviando(true);
    setResultado(null);
    const { data, error } = await supabase.rpc('registrar_asistencia_qr', {
      p_alumno_id: alumnoId,
    });
    if (error) {
      setResultado({ ok: false, error: 'No pudimos registrar la asistencia. Revisa tu conexión e inténtalo de nuevo.' });
    } else {
      setResultado(data as Resultado);
    }
    setEnviando(false);
  };

  const fechaBonita = (fecha?: string) =>
    format(parseISO(fecha || hoy), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  if (resultado) {
    return (
      <div className="min-h-screen bg-[#131313] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1a1a1a] border-4 border-white p-8 shadow-brutal-lg text-center">
          {resultado.ok ? (
            <CheckCircle2 size={64} className="text-neon-green mx-auto mb-4" />
          ) : (
            <XCircle size={64} className="text-hot-pink mx-auto mb-4" />
          )}
          <h1 className={`font-anton text-3xl uppercase mb-2 ${resultado.ok ? 'text-neon-green' : 'text-hot-pink'}`}>
            {resultado.ok ? '¡Asistencia registrada!' : 'No se pudo registrar'}
          </h1>
          <p className="font-mono text-sm text-white/70 uppercase mb-1">{resultado.nombre}</p>
          <p className="font-mono text-xs text-white/40 uppercase mb-4">{fechaBonita(resultado.fecha)}</p>
          {resultado.ok && typeof resultado.registrados_hoy === 'number' && (
            <p className={`font-anton text-lg uppercase mb-2 ${resultado.clase_confirmada ? 'text-neon-green' : 'text-yellow-400'}`}>
              {resultado.clase_confirmada
                ? '¡Clase confirmada!'
                : `Clase en espera (${resultado.registrados_hoy}/4)`}
            </p>
          )}
          <p className="font-mono text-xs text-white/60 mb-8">
            {resultado.ok ? resultado.mensaje : resultado.error}
          </p>
          <button
            onClick={() => { setResultado(null); setSeleccionado(null); }}
            className="btn-tape w-full py-3 font-anton text-lg tracking-widest"
          >
            REGISTRAR OTRA ASISTENCIA
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#131313] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <QrCode size={40} className="text-neon-green mx-auto mb-3" />
          <h1 className="font-anton text-4xl uppercase leading-none">
            Registro de <span className="text-neon-green">asistencia</span>
          </h1>
          <p className="font-mono text-xs text-white/50 mt-3 uppercase">
            Club de Patinaje Travesía
          </p>
          <p className="font-mono text-xs text-neon-green mt-1 uppercase">
            {fechaBonita()}
          </p>
        </div>

        <div className="bg-[#1a1a1a] border-4 border-white p-6 shadow-brutal-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-anton text-xl uppercase flex items-center gap-2">
              <UserRound className="text-neon-green" size={20} /> Elige tu nombre
            </h2>
          </div>

          {!seleccionado ? (
            <>
              <label htmlFor="buscar-alumno" className="sr-only">Buscar por nombre o número de alumno</label>
              <div className="flex items-center gap-2 bg-black border-2 border-white/20 p-2 mb-3 focus-within:border-neon-green">
                <Search size={16} className="text-white/40" />
                <input
                  id="buscar-alumno"
                  type="search"
                  autoComplete="off"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Busca tu nombre o número..."
                  className="bg-transparent flex-1 min-w-0 outline-none font-mono text-sm uppercase placeholder:text-white/20"
                />
              </div>
              <div className="max-h-72 overflow-y-auto border-2 border-white/10">
                {loading ? (
                  <p className="p-4 text-center font-mono text-xs text-white/40 animate-pulse">Cargando alumnos...</p>
                ) : loadError ? (
                  <div className="p-4 text-center">
                    <p className="font-mono text-xs text-hot-pink uppercase mb-3">No pudimos cargar la lista.</p>
                    <button onClick={cargarAlumnos} className="border border-white/30 px-4 py-2 font-mono text-xs hover:bg-white/10">
                      REINTENTAR
                    </button>
                  </div>
                ) : filtrados.length === 0 ? (
                  <p className="p-4 text-center font-mono text-xs text-white/40 uppercase">Sin resultados</p>
                ) : (
                  filtrados.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setSeleccionado(a)}
                      className="w-full text-left p-3 font-mono text-sm uppercase border-b border-white/5 hover:bg-neon-green hover:text-black transition-colors flex gap-3"
                    >
                      <span className="text-white/40">#{a.numero_alumno}</span> {a.nombre_completo}
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="font-mono text-[10px] text-white/40 uppercase mb-1">Registrando asistencia de</p>
              <p className="font-anton text-2xl uppercase text-neon-green mb-2">{seleccionado.nombre_completo}</p>
              <p className="font-mono text-xs text-white/50 uppercase mb-6">{fechaBonita()}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSeleccionado(null)}
                  disabled={enviando}
                  className="flex-1 border border-white/20 py-3 font-mono text-xs hover:bg-white/5 disabled:opacity-50"
                >
                  CAMBIAR
                </button>
                <button
                  onClick={() => registrar(seleccionado.id)}
                  disabled={enviando}
                  className="flex-1 bg-neon-green text-black font-anton text-xl py-3 hover:brightness-110 disabled:opacity-50"
                >
                  {enviando ? 'REGISTRANDO...' : 'CONFIRMAR'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="font-mono text-[10px] text-white/40 text-center uppercase leading-relaxed mt-5">
          La clase queda confirmada cuando se registran al menos 4 estudiantes.
        </p>
      </div>
    </main>
  );
}
