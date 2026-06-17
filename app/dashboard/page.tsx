'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AsistenciaTab from '@/components/dashboard/AsistenciaTab';
import PagosTab from '@/components/dashboard/PagosTab';
import GaleriaTab from '@/components/dashboard/GaleriaTab';
import { Users, CreditCard, Image as ImageIcon, LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'clubdepatinajetravesia@gmail.com';

type Tab = 'asistencia' | 'pagos' | 'galeria';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('asistencia');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-neon-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-white pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-[1600px] mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b-4 border-white pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-neon-green animate-pulse rounded-full" />
              <span className="font-mono text-[10px] text-neon-green uppercase tracking-[0.3em] font-bold">
                Sistema de Gestión Interna v3.0
              </span>
            </div>
            <h1 className="font-anton text-6xl md:text-8xl uppercase leading-[0.8] tracking-tighter">
              CONTROL<br/>
              <span className="text-white/40">PANEL</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="font-mono text-[10px] text-white/40 uppercase">Sesión activa</p>
                <p className="font-mono text-sm text-neon-green font-bold">{user?.email}</p>
             </div>
             <button
                onClick={handleSignOut}
                className="btn-tape px-4 py-2 flex items-center gap-2 text-xs"
             >
                <LogOut size={14} /> SALIR
             </button>
          </div>
        </header>

        {/* Dashboard Tabs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

          {/* Sidebar Navigation */}
          <aside className="flex flex-col gap-2">
            {[
              { id: 'asistencia', label: 'Asistencia', icon: Users },
              { id: 'pagos', label: 'Planilla Pagos', icon: CreditCard },
              { id: 'galeria', label: 'Galería Media', icon: ImageIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`
                  flex items-center gap-4 p-5 font-anton text-xl uppercase tracking-wider transition-all border-l-8
                  ${activeTab === tab.id
                    ? 'bg-white text-black border-neon-green translate-x-2'
                    : 'bg-[#1a1a1a] text-white/40 border-transparent hover:bg-[#222] hover:text-white'}
                `}
              >
                <tab.icon size={24} className={activeTab === tab.id ? 'text-black' : 'text-white/20'} />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Content Area */}
          <main className="bg-[#1a1a1a] border-4 border-white p-6 md:p-10 shadow-brutal-lg min-h-[600px] overflow-x-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'asistencia' && <AsistenciaTab />}
                {activeTab === 'pagos' && <PagosTab />}
                {activeTab === 'galeria' && <GaleriaTab />}
              </motion.div>
            </AnimatePresence>
          </main>

        </div>
      </div>
    </div>
  );
}
