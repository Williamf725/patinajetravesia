'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { signOut } from '@/app/auth/actions';

const navLinks = [
  { name: 'La Historia', href: '#' },
  { name: 'Entrenamientos', href: '#' },
  { name: 'Galería', href: '#' },
  { name: 'Únete', href: '#' },
];

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-8"
    >
      <div className="flex gap-6 md:gap-10">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="nav-link text-xs md:text-sm tracking-widest"
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {!loading && (
          <>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="nav-link text-xs md:text-sm tracking-widest !text-white"
                >
                  DASHBOARD
                </Link>
                <form action={signOut}>
                  <button className="btn-tape !bg-hot-pink text-black border-black text-xs md:text-sm px-4 py-2">
                    SALIR
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login">
                <button className="btn-tape !bg-neon-orange text-black border-black text-xs md:text-sm px-4 py-2">
                  INICIA SESIÓN
                </button>
              </Link>
            )}
          </>
        )}
      </div>
    </motion.nav>
  );
}
