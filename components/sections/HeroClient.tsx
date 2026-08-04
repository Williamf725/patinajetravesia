'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroClient() {
  return (
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
          <Link
            href="/registro"
            className="btn-tape inline-block text-base md:text-xl mt-2 px-6 py-2.5 text-center"
          >
            ÚNETE AL PARCHE
          </Link>
        </motion.div>
      </div>

      {/* Bottom Label (Small Details for "Expensive" feel) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:left-20 md:translate-x-0 font-mono text-[10px] md:text-xs text-neon-green tracking-[0.3em] uppercase opacity-60">
        {/* // Bogota, Colombia — Est. 2024 // Urban Skating Culture */}
      </div>
    </div>
  );
}
