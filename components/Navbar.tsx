'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'clubdepatinajetravesia@gmail.com';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cantidadCarrito, setCantidadCarrito] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch and subscribe to shopping cart items to keep count synchronized
  useEffect(() => {
    if (!user) {
      setCantidadCarrito(0);
      return;
    }

    const fetchCartCount = async () => {
      const { data, error } = await supabase
        .from('carrito')
        .select('cantidad')
        .eq('user_id', user.id);
      if (!error && data) {
        const totalQty = data.reduce((acc, curr) => acc + curr.cantidad, 0);
        setCantidadCarrito(totalQty);
      }
    };

    fetchCartCount();

    const channel = supabase
      .channel('navbar-cart-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carrito' }, () => {
        fetchCartCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        setError('Correo o contraseña incorrectos');
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Debes confirmar tu correo antes de iniciar sesión');
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo');
      }
      setIsSubmitting(false);
    } else if (data.user) {
      setIsModalOpen(false);
      setIsSubmitting(false);
      setEmail('');
      setPassword('');

      // Redirect logic for modal login
      if (data.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/portal';
      }
    }
  };

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const glassmorphismStyle = {
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '8px 16px',
    color: '#fff',
    fontSize: '11px',
    letterSpacing: '1.5px',
    fontFamily: 'Anton',
    textDecoration: 'none',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <>
      {/* Navbar flotante transparente */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'transparent',
        height: '60px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 20px',
      }}>
        {/* Logo — completamente transparente */}
        <Link href="/" style={{ background: 'transparent' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784734270/40930-removebg-preview_bmvhkt.png"
            style={{ height: '36px', width: 'auto' }} alt="Travesía" />
        </Link>

        {/* Desktop links — flotantes sin fondo */}
        <div className="desktop-nav" style={{ gap: '32px' }}>
          {['#historia', '#entrenamientos', '#galeria', '/tienda', '#unete'].map((href, i) => (
            <Link key={href} href={href}
              style={{ color: '#fff', fontFamily: 'Anton', fontSize: '13px',
              letterSpacing: '2px', textDecoration: 'none' }}
              className="hover:text-neon-green transition-colors"
            >
              {['HISTORIA','ENTRENAMIENTOS','GALERÍA','TIENDA','ÚNETE'][i]}
            </Link>
          ))}
        </div>

        {/* Derecha: carrito + menú */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Ícono carrito con glassmorphism */}
          <Link href="/tienda" style={{ ...glassmorphismStyle, position: 'relative', width: 'auto', height: 'auto' }} className="hover:text-neon-green hover:border-neon-green/30 transition-colors">
            {/* Ícono carrito SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {/* Contador carrito */}
            {cantidadCarrito > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: '#00ff88', color: '#000', borderRadius: '50%',
                width: '16px', height: '16px', fontSize: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {cantidadCarrito}
              </span>
            )}
          </Link>

          {/* Botón sesión con glassmorphism — visible en desktop */}
          <div className="desktop-auth" style={{ gap: '12px' }}>
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    {!isAdmin && (
                      <Link
                        href="/portal"
                        style={glassmorphismStyle}
                        className="hover:text-neon-green hover:border-neon-green/30 transition-colors"
                      >
                        MI PORTAL
                      </Link>
                    )}
                    {isAdmin ? (
                      <Link
                        href="/dashboard"
                        style={glassmorphismStyle}
                        className="hover:text-neon-green hover:border-neon-green/30 transition-colors"
                      >
                        PANEL CONTROL
                      </Link>
                    ) : null}
                    <button
                      onClick={() => supabase.auth.signOut()}
                      style={{ ...glassmorphismStyle, cursor: 'pointer' }}
                      className="hover:text-hot-pink hover:border-hot-pink/30 transition-colors"
                    >
                      CERRAR SESIÓN
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/registro"
                      style={glassmorphismStyle}
                      className="hover:text-neon-green hover:border-neon-green/30 transition-colors"
                    >
                      ÚNETE
                    </Link>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      style={{ ...glassmorphismStyle, cursor: 'pointer' }}
                      className="hover:text-neon-green hover:border-neon-green/30 transition-colors"
                    >
                      ADMIN
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Hamburguesa con glassmorphism — solo móvil */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="mobile-menu-btn"
            style={{ ...glassmorphismStyle, cursor: 'pointer', padding: '8px 12px', display: undefined }}
          >
            {menuAbierto ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Menú móvil desplegable — glassmorphism pequeño y compacto */}
      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: '68px',
              right: '16px',
              width: '220px',
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px',
              padding: '12px',
              zIndex: 99,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {[
              { href: '#historia', label: 'HISTORIA' },
              { href: '#entrenamientos', label: 'ENTRENAMIENTOS' },
              { href: '#galeria', label: 'GALERÍA' },
              { href: '/tienda', label: 'TIENDA' },
              { href: '#unete', label: 'ÚNETE' },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                onClick={() => setMenuAbierto(false)}
                style={{
                  color: '#fff',
                  fontFamily: 'Space Grotesk',
                  fontSize: '15px',
                  letterSpacing: '1px',
                  textDecoration: 'none',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  transition: 'background 0.2s',
                  display: 'block',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {label}
              </Link>
            ))}

            {/* Separador */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

            {/* Botón sesión en estilo de lista compacta tipo Link */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {!loading && (
                <>
                  {user ? (
                    <>
                      <div style={{
                        color: 'rgba(255,255,255,0.4)',
                        fontFamily: 'Space Grotesk',
                        fontSize: '10px',
                        letterSpacing: '1px',
                        padding: '4px 16px',
                        wordBreak: 'break-all'
                      }}>
                        {user.email?.toUpperCase()}
                      </div>
                      {!isAdmin && (
                        <Link
                          href="/portal"
                          onClick={() => setMenuAbierto(false)}
                          style={{
                            color: '#00ff88',
                            fontFamily: 'Space Grotesk',
                            fontSize: '15px',
                            letterSpacing: '1px',
                            textDecoration: 'none',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            transition: 'background 0.2s',
                            display: 'block',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          MI PORTAL
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          href="/dashboard"
                          onClick={() => setMenuAbierto(false)}
                          style={{
                            color: '#00ff88',
                            fontFamily: 'Space Grotesk',
                            fontSize: '15px',
                            letterSpacing: '1px',
                            textDecoration: 'none',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            transition: 'background 0.2s',
                            display: 'block',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          PANEL CONTROL
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setMenuAbierto(false);
                          supabase.auth.signOut();
                        }}
                        style={{
                          color: '#fff',
                          fontFamily: 'Space Grotesk',
                          fontSize: '15px',
                          letterSpacing: '1px',
                          textDecoration: 'none',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          transition: 'background 0.2s',
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        CERRAR SESIÓN
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/registro"
                        onClick={() => setMenuAbierto(false)}
                        style={{
                          color: '#00ff88',
                          fontFamily: 'Space Grotesk',
                          fontSize: '15px',
                          letterSpacing: '1px',
                          textDecoration: 'none',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          transition: 'background 0.2s',
                          display: 'block',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        ÚNETE
                      </Link>
                      <button
                        onClick={() => {
                          setMenuAbierto(false);
                          setIsModalOpen(true);
                        }}
                        style={{
                          color: '#fff',
                          fontFamily: 'Space Grotesk',
                          fontSize: '15px',
                          letterSpacing: '1px',
                          textDecoration: 'none',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          transition: 'background 0.2s',
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        ACCESO ADMIN
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay invisible para cerrar el menú al tocar fuera */}
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 98 }}
        />
      )}

      {/* Login Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#131313] border-4 border-white p-8 md:p-10 shadow-brutal-lg"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors font-mono text-xl"
              >
                ✕
              </button>

              <h2 className="font-anton text-4xl text-white uppercase mb-2 tracking-tight">
                ADMIN <span className="text-neon-green">GATEWAY</span>
              </h2>
              <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.3em] mb-8">
                Identify yourself
              </p>

              <form onSubmit={handleLogin} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-transparent border-b-2 border-white/20 p-2 text-white focus:border-neon-green outline-none transition-all font-mono text-sm"
                    placeholder="admin@travesia.club"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] text-neon-green uppercase tracking-[0.2em] font-bold">
                    Key
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-transparent border-b-2 border-white/20 p-2 text-white focus:border-neon-green outline-none transition-all font-mono text-sm"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-hot-pink/10 border-l-4 border-hot-pink text-hot-pink font-mono text-[9px] uppercase tracking-wider">
                    {error}
                  </div>
                )}

                <button
                  disabled={isSubmitting}
                  className="btn-tape w-full py-4 mt-4 text-lg tracking-widest font-anton disabled:opacity-50"
                >
                  {isSubmitting ? 'VERIFICANDO...' : 'INGRESAR'}
                </button>
              </form>

              <div className="mt-8 text-center">
                 <p className="font-mono text-[10px] text-white/40 uppercase">
                   {error && error.includes('existe una cuenta') ? (
                     <Link href="/login" onClick={() => setIsModalOpen(false)} className="text-neon-green hover:underline">INICIA SESIÓN AQUÍ</Link>
                   ) : (
                     <>¿NO TIENES CUENTA? <Link href="/registro" onClick={() => setIsModalOpen(false)} className="text-neon-green hover:underline">REGÍSTRATE AQUÍ</Link></>
                   )}
                 </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
