'use client';

import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col md:flex-row items-center justify-between px-6 md:px-20 py-10 relative">

      {/* Left Content: Main Title */}
      <div className="flex flex-col items-center md:items-start text-center md:text-left z-10 space-y-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="font-anton text-6xl md:text-[10rem] leading-[0.9] text-white uppercase tracking-tight drop-shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
            Club de Patinaje<br />
            <span className="text-white">Travesía</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <button className="btn-tape text-lg md:text-2xl mt-4">
            ÚNETE AL PARCHE
          </button>
        </motion.div>
      </div>

      {/* Right Content: Circular Badge / Branding */}
      <motion.div
        initial={{ opacity: 0, rotate: -20, scale: 0.5 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
        className="relative mt-12 md:mt-0 w-[280px] h-[280px] md:w-[500px] md:h-[500px]"
      >
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-white/20 animate-[spin_20s_linear_infinite]" />

        {/* Logo Placeholder with Brutalist Text Path feel */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-[90%] h-[90%] rounded-full border-8 border-black/40 shadow-brutal-lg overflow-hidden flex items-center justify-center bg-[#131313]/40 backdrop-blur-sm">
             {/* This simulates the circular seal in the image */}
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

          {/* Circular text simulation using a background image if possible, or just layout */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full rounded-full border-[20px] border-white/10" />
          </div>
        </div>
      </motion.div>

      {/* Bottom Label (Small Details for "Expensive" feel) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:left-20 md:translate-x-0 font-mono text-[10px] md:text-xs text-neon-green tracking-[0.3em] uppercase opacity-60">
        {/* // Bogota, Colombia — Est. 2024 // Urban Skating Culture */}
      </div>

    </div>
  );
}
