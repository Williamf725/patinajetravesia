'use client';

import { motion } from 'framer-motion';
import TvSection from '@/components/sections/TvSection';
import EsenciaSection from '@/components/sections/EsenciaSection';
import EntrenamientosSection from '@/components/sections/EntrenamientosSection';
import UneteSection from '@/components/sections/UneteSection';
import TiendaPreview from '@/components/sections/TiendaPreview';

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
            href="https://wa.me/573222508676?text=Hola,%20quiero%20unirme%20al%20Club%20de%20Patinaje%20Travesía"
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

    {/* Sección preview tienda */}
    <TiendaPreview />

    {/* Sección seguro */}
    <section className="relative py-12 md:py-16 px-6 max-w-6xl mx-auto w-full z-10">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-black border-4 border-neon-green p-8 md:p-12 text-center relative shadow-brutal flex flex-col items-center gap-6"
      >
        {/* Logo de Seguro Mundial centrado */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784131243/seguro-mundial_phqk3p.png"
          alt="Seguro Mundial"
          className="max-w-[200px] w-full h-auto object-contain select-none"
        />

        <div className="space-y-4 max-w-2xl">
          <h2 className="font-anton text-4xl md:text-5xl text-white uppercase tracking-tight leading-none">
            PATINA CON RESPALDO
          </h2>
          <p className="font-space text-base md:text-lg text-white/90 leading-relaxed">
            Todos nuestros alumnos cuentan con póliza de seguro contra accidentes con Seguro Mundial. Tu tranquilidad y la de tu familia es nuestra prioridad.
          </p>
        </div>

        <div className="bg-white/5 border border-white/20 p-4 font-mono text-xs md:text-sm text-neon-green uppercase tracking-wide">
          Póliza vigente por 1 año desde tu inscripción — incluida en el costo de inscripción de $20.000 COP
        </div>
      </motion.div>
    </section>

    <EsenciaSection />
    <TvSection />
    <EntrenamientosSection />
    <UneteSection />
    </>
  );
}
