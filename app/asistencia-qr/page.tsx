'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { QrCode, Search, CheckCircle2, XCircle, LogIn, UserRound } from 'lucide-react';

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
  const [alumnos, setAlumnos] = useState<AlumnoQR[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<AlumnoQR | null>(null);
  const [resultado, setResultado] = useState<Resultado>(null);
  const [enviando, setEnviando] = useState(false);

  // Sesión iniciada
  const [sesionEmail, setSesionEmail] = useState<string | null>(null);
  const [miAlumnoId, setMiAlumnoId] = useState<string | null>(null);
  const [modo, setModo] = useState<'elegir' | 'login'>('elegir');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const supabase = createClient();
  const hoy = getBogotaToday();

  useEffect(() => {
    const init = async () => {
      // ¿Hay sesión iniciada?
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setSesionEmail(user.email);
        const { data: alumno } = await supabase
          .from('alumnos')
          .select('id')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();
        if (alumno) setMiAlumnoId(alumno.id);
      }

      // Lista de alumnos para el selector público
      const { data } = await supabase.rpc('obtener_alumnos_qr');
      if (data) setAlumnos(data as AlumnoQR[]);
      setLoading(false);
    };
    init();
  }, [supabase]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return alumnos;
    return alumnos.filter(a =>
      a.nombre_completo.toLowerCase().includes(q) ||
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
      setResultado({ ok: false, error: 'Error de conexión. Intenta de nuevo.' });
    } else {
      setResultado(data as Resultado);
    }
    setEnviando(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim().toLowerCase(),
      password: loginPass,
    });
    if (error) {
      setLoginError('Correo o contraseña incorrectos.');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;
    setSesionEmail(user.email);
    const { data: alumno } = await supabase
      .from('alumnos')
      .select('id, nombre_completo')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();
    if (alumno) {
      setMiAlumnoId(alumno.id);
    } else {
      setLoginError('Esta cuenta no tiene una ficha de alumno vinculada.');
    }
  };

  const fechaBonita = (f?: string) =>
    f ? format(parseISO(f), 'EEEE d \'de\' MMMM', { locale: es }) : format(parseISO(hoy), 'EEEE d \'de\' MMMM', { locale: es });

  // ---------- Vista de resultado ----------
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
            <p className={`font-anton text-lg uppercase mb-2 ${
              resultado.clase_confirmada ? 'text-neon-green' : 'text-yellow-400'
            }`}>
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
            VOLVER
          </button>
        </div>
      </div>
    );
  }

  // ---------- Vista principal ----------
  return (
    <div className="min-h-screen bg-[#131313] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <QrCode size={40} className="text-neon-green mx-auto mb-3" />
          <h1 className="font-anton text-4xl uppercase leading-none">
            Registro de <span className="text-neon-green">asistencia</span>
          </h1>
          <p className="font-mono text-xs text-white/40 mt-2 uppercase">
            Club de Patinaje Travesía — {fechaBonita()}
          </p>
        </div>

        {/* Opción A: sesión iniciada */}
        {sesionEmail && miAlumnoId && (
          <div className="bg-[#1a1a1a] border-4 border-white p-6 shadow-brutal-lg mb-6">
            <p className="font-mono text-[10px] text-white/40 uppercase mb-1">Sesión iniciada</p>
            <p className="font-anton text-xl uppercase mb-4 truncate">{sesionEmail}</p>
            <button
              onClick={() => registrar(miAlumnoId)}
              disabled={enviando}
              className="w-full bg-neon-green text-black font-anton text-2xl py-4 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} /> {enviando ? 'REGISTRANDO...' : 'MARCAR MI ASISTENCIA'}
            </button>
          </div>
        )}

        {/* Opción B: elegir nombre de la lista */}
        <div className="bg-[#1a1a1a] border-4 border-white p-6 shadow-brutal-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-anton text-xl uppercase flex items-center gap-2">
              <UserRound className="text-neon-green" size={20} /> ¿Sin sesión? Elige tu nombre
            </h2>
          </div>

          {!seleccionado ? (
            <>
              <div className="flex items-center gap-2 bg-black border-2 border-white/20 p-2 mb-3">
                <Search size={16} className="text-white/40" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Busca tu nombre o número..."
                  className="bg-transparent flex-1 outline-none font-mono text-sm uppercase placeholder:text-white/20"
                />
              </div>
              <div className="max-h-64 overflow-y-auto border-2 border-white/10">
                {loading ? (
                  <p className="p-4 text-center font-mono text-xs text-white/40 animate-pulse">Cargando alumnos...</p>
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
              <p className="font-mono text-[10px] text-white/40 uppercase mb-1">Registrando como</p>
              <p className="font-anton text-2xl uppercase text-neon-green mb-6">{seleccionado.nombre_completo}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSeleccionado(null)}
                  className="flex-1 border border-white/20 py-3 font-mono text-xs hover:bg-white/5"
                >
                  CAMBIAR
                </button>
                <button
                  onClick={() => registrar(seleccionado.id)}
                  disabled={enviando}
                  className="flex-1 bg-neon-green text-black font-anton text-xl py-3 hover:brightness-110 disabled:opacity-50"
                >
                  {enviando ? '...' : 'CONFIRMAR'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Alternar a login */}
        {!sesionEmail && (
          <div className="mt-6">
            {modo === 'login' ? (
              <form onSubmit={handleLogin} className="bg-[#1a1a1a] border-4 border-white p-6 shadow-brutal-lg">
                <h2 className="font-anton text-xl uppercase flex items-center gap-2 mb-4">
                  <LogIn className="text-neon-green" size={20} /> Iniciar sesión
                </h2>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="Correo"
                  className="w-full bg-transparent border-b-2 border-white/20 p-2 mb-3 outline-none focus:border-neon-green font-mono text-sm"
                />
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full bg-transparent border-b-2 border-white/20 p-2 mb-3 outline-none focus:border-neon-green font-mono text-sm"
                />
                {loginError && <p className="font-mono text-xs text-hot-pink mb-3">{loginError}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModo('elegir')} className="flex-1 border border-white/20 py-3 font-mono text-xs hover:bg-white/5">
                    CANCELAR
                  </button>
                  <button type="submit" className="flex-1 bg-white text-black font-anton text-lg py-3 hover:bg-neon-green">
                    ENTRAR
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setModo('login')}
                className="w-full font-mono text-xs text-white/40 hover:text-neon-green uppercase tracking-widest py-2"
              >
                ¿Tienes cuenta? Inicia sesión aquí
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
