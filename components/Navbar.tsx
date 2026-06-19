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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    } else {
      setIsModalOpen(false);
      setIsSubmitting(false);
      setEmail('');
      setPassword('');
    }
  };

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-8"
      >
        <Link href="/" className="font-anton text-2xl md:text-3xl text-white tracking-tighter hover:text-neon-green transition-colors duration-300">
          TRAVESÍA<span className="text-neon-green">.</span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          <a href="#historia" className="nav-link text-xs tracking-widest uppercase">La Historia</a>
          <a href="#entrenamientos" className="nav-link text-xs tracking-widest uppercase">Entrenamientos</a>
          <a href="#galeria" className="nav-link text-xs tracking-widest uppercase">Galería</a>
          <a href="#unete" className="nav-link text-xs tracking-widest uppercase">Únete</a>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
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
      </motion.nav>

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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
