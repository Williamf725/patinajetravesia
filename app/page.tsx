'use client';

import { motion } from 'framer-motion';
import TvSection from '@/components/sections/TvSection';
import EsenciaSection from '@/components/sections/EsenciaSection';
import EntrenamientosSection from '@/components/sections/EntrenamientosSection';
import UneteSection from '@/components/sections/UneteSection';

export default function Home() {
  return (
    <>
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 md:px-20 py-10 relative">

      {/* Main Content: Title & Button */}
      <div className="flex flex-col items-center text-center z-10 space-y-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="font-anton text-5xl md:text-[7.3rem] leading-[0.9] text-white uppercase tracking-tight drop-shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
            Club de Patinaje<br />
            <span className="text-white">Travesía</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <a
            href="https://wa.me/573202027777?text=Hola,%20quiero%20unirme%20al%20Club%20de%20Patinaje%20Travesía"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tape inline-block text-base md:text-xl mt-2 px-6 py-2.5"
          >
            ÚNETE AL PARCHE
          </a>
        </motion.div>
      </div>

      {/* Right Content: Circular Badge / Branding (Comentado para uso posterior) */}
      {/*
      <motion.div
        initial={{ opacity: 0, rotate: -20, scale: 0.5 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
        className="relative mt-12 md:mt-0 w-[280px] h-[280px] md:w-[500px] md:h-[500px]"
      >
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-white/20 animate-[spin_20s_linear_infinite]" />

        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-[90%] h-[90%] rounded-full border-8 border-black/40 shadow-brutal-lg overflow-hidden flex items-center justify-center bg-[#131313]/40 backdrop-blur-sm">
             <div className="text-center font-anton text-white/90 p-8 select-none">
                <p className="text-xl md:text-3xl border-b-4 border-neon-green pb-2">ADULTOS</p>
                <p className="text-4xl md:text-6xl pt-2">TRAVESÍA</p>
                <div className="mt-4 flex justify-center">
                  <div className="w-12 h-12 md:w-20 md:h-20 bg-neon-green rounded-full flex items-center justify-center shadow-brutal">
                    <span className="text-black text-2xl md:text-4xl">⚡</span>
                  </div>
                </div>
             </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full rounded-full border-[20px] border-white/10" />
          </div>
        </div>
      </motion.div>
      */}

      {/* Bottom Label (Small Details for "Expensive" feel) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:left-20 md:translate-x-0 font-mono text-[10px] md:text-xs text-neon-green tracking-[0.3em] uppercase opacity-60">
        {/* // Bogota, Colombia — Est. 2024 // Urban Skating Culture */}
      </div>

    </div>

    <EsenciaSection />
    <TvSection />
    <EntrenamientosSection />
    <UneteSection />
    </>
  );
}
