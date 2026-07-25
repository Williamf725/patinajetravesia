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

  return (
    <>
      {/* Navbar mobile-first */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)',
        height: '60px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 16px',
        borderBottom: '1px solid #222'
      }}>
        {/* Logo */}
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784734270/40930-removebg-preview_bmvhkt.png"
            style={{ height: '36px', width: 'auto' }} alt="Travesía" />
        </Link>

        {/* Desktop links — ocultos en móvil */}
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
          {/* Ícono carrito - siempre visible */}
          <Link href="/tienda" style={{ position: 'relative', color: '#fff' }} className="hover:text-neon-green transition-colors">
            {/* Ícono carrito SVG */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {/* Contador carrito */}
            {cantidadCarrito > 0 && (
              <span style={{
                position: 'absolute', top: '-8px', right: '-8px',
                background: '#00ff88', color: '#000', borderRadius: '50%',
                width: '18px', height: '18px', fontSize: '11px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {cantidadCarrito}
              </span>
            )}
          </Link>

          {/* Botón sesión — visible en desktop */}
          <div className="desktop-auth" style={{ gap: '12px' }}>
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    {!isAdmin && (
                      <Link
                        href="/portal"
                        className="btn-tape text-[10px] md:text-xs tracking-widest px-4 py-2"
                      >
                        MI PORTAL
                      </Link>
                    )}
                    {isAdmin ? (
                      <Link
                        href="/dashboard"
                        className="nav-link text-[10px] md:text-xs tracking-widest uppercase border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-all"
                        style={{ color: '#fff', textDecoration: 'none' }}
                      >
                        PANEL CONTROL
                      </Link>
                    ) : null}
                    <button
                      onClick={() => supabase.auth.signOut()}
                      className="nav-link text-[10px] md:text-xs tracking-widest uppercase border border-white/20 px-4 py-2 hover:opacity-70 transition-opacity"
                    >
                      CERRAR SESIÓN
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/registro"
                      className="btn-tape text-[10px] md:text-xs tracking-widest px-4 py-2"
                    >
                      UNIRSE
                    </Link>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="nav-link text-[10px] md:text-xs tracking-widest uppercase border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-all"
                    >
                      ADMIN
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Hamburguesa — solo móvil */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="mobile-menu-btn"
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            {menuAbierto ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Menú móvil desplegable */}
      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.97)', zIndex: 99,
              display: 'flex', flexDirection: 'column', padding: '32px 24px', gap: '24px',
              overflowY: 'auto'
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
                style={{ color: '#fff', fontFamily: 'Anton', fontSize: '28px',
                letterSpacing: '2px', textDecoration: 'none', borderBottom: '1px solid #222',
                paddingBottom: '24px' }}>
                {label}
              </Link>
            ))}

            {/* Botón sesión dentro del menú móvil */}
            <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
              {!loading && (
                <>
                  {user ? (
                    <div className="flex flex-col gap-4">
                      <div className="font-mono text-xs text-white/40 uppercase">Sesión activa: <span className="text-neon-green font-bold">{user.email}</span></div>
                      {!isAdmin && (
                        <Link
                          href="/portal"
                          onClick={() => setMenuAbierto(false)}
                          className="btn-tape w-full py-4 text-center font-anton text-xl tracking-widest"
                        >
                          MI PORTAL
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          href="/dashboard"
                          onClick={() => setMenuAbierto(false)}
                          className="btn-tape w-full py-4 text-center font-anton text-xl tracking-widest"
                        >
                          PANEL CONTROL
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setMenuAbierto(false);
                          supabase.auth.signOut();
                        }}
                        className="w-full py-4 text-center font-anton text-xl tracking-widest border border-white/20 hover:bg-white hover:text-black transition-all"
                      >
                        CERRAR SESIÓN
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <Link
                        href="/registro"
                        onClick={() => setMenuAbierto(false)}
                        className="btn-tape w-full py-4 text-center font-anton text-xl tracking-widest"
                      >
                        UNIRSE AL CLUB
                      </Link>
                      <button
                        onClick={() => {
                          setMenuAbierto(false);
                          setIsModalOpen(true);
                        }}
                        className="w-full py-4 text-center font-anton text-xl tracking-widest border border-white/20 hover:bg-white hover:text-black transition-all"
                      >
                        ACCESO ADMIN
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
