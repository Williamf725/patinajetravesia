'use client';

import { motion } from 'framer-motion';

export default function PlanesSection() {
  return (
    <section id="planes" className="relative overflow-hidden border-t-4 border-white/10 bg-[#0a0a0a] px-6 py-24">
      <div className="absolute inset-0 bg-grain pointer-events-none opacity-20" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <p className="mb-4 text-center font-mono text-xs font-bold uppercase tracking-[0.3em] text-hot-pink">
          Únete al parche
        </p>
        <h2 className="mb-14 text-center font-anton text-5xl uppercase tracking-tight text-white md:text-7xl">
          Planes y <span className="text-neon-green">tarifas</span>
        </h2>

        <motion.article
          initial={{ opacity: 0, y: 50, rotate: -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', damping: 14, stiffness: 100 }}
          className="mx-auto max-w-md border-4 border-neon-green bg-[#131313] p-8 shadow-brutal-lg md:p-10"
        >
          <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-hot-pink">
            Plan mensual
          </p>
          <h3 className="font-anton text-4xl uppercase text-white">16 clases</h3>
          <div className="my-8 flex flex-wrap items-end gap-x-3">
            <span className="font-anton text-6xl leading-none text-neon-green">$120.000</span>
            <span className="pb-1 font-mono text-sm text-white/50">COP / mes</span>
          </div>
          <ul className="space-y-3 font-space text-white/70">
            <li>✓ 16 clases al mes</li>
            <li>✓ Acceso a los horarios disponibles</li>
          </ul>
          <a
            href="https://wa.me/573222508676?text=Hola,%20quiero%20inscribirme%20en%20el%20plan%20de%2016%20clases%20por%20$120.000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tape mt-10 block w-full py-4 text-center font-anton text-xl tracking-widest"
          >
            INSCRÍBETE AHORA
          </a>
        </motion.article>
      </div>
    </section>
  );
}
