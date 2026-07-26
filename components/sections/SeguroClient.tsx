'use client';

import { motion } from 'framer-motion';

export default function SeguroClient() {
  return (
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
  );
}
