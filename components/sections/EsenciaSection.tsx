'use client';

import { motion, Variants } from 'framer-motion';

export default function EsenciaSection() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, rotate: -2 },
    visible: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section id="historia" className="relative py-24 md:py-40 px-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 -right-20 text-[20vw] font-anton text-white/5 uppercase select-none pointer-events-none">
        ESSENCE
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-4 items-start"
      >
        {/* Wrinkled Paper Item */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-6 relative z-10"
        >
          {/* Clear Tape */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 clear-tape rotate-2 z-20" />

          <div className="bg-paper-texture p-8 md:p-12 shadow-brutal transform -rotate-1 relative">
            <h2 className="font-anton text-4xl md:text-5xl text-black uppercase mb-6 border-b-4 border-neon-green inline-block">
              NUESTRA ESENCIA
            </h2>
            <p className="font-space text-lg md:text-xl text-black/80 leading-relaxed">
              Somos un club de patinaje en Sogamoso hecho para adultos que se negaron a dejar de moverse.
              Aquí no hay edad mínima ni máxima — solo ganas de salir de la rutina, conocer gente nueva
              y demostrar que siempre hay algo increíble por aprender.
            </p>
          </div>
        </motion.div>

        {/* Wood Board Item */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-5 md:col-start-8 mt-12 md:mt-20 relative"
        >
          {/* Shadow for wood effect */}
          <div className="absolute inset-0 bg-black/40 translate-x-3 translate-y-3" />

          <div className="bg-[#2a1a0a] p-8 border-t-4 border-[#3a2a1a] shadow-2xl relative overflow-hidden">
            {/* Wood Grain Texture (Simple CSS) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                 style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.2) 21px)' }} />

            {/* Clavos (Nails) */}
            <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-zinc-500 shadow-inner" />
            <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-zinc-500 shadow-inner" />
            <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-zinc-500 shadow-inner" />
            <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-zinc-500 shadow-inner" />

            <p className="font-mono text-base text-zinc-300 uppercase tracking-tight leading-snug">
              Patinar no es solo deporte: es reírse de los tropiezos, celebrar cada avance
              y compartir con otros que entienden que la vida se disfruta en movimiento.
            </p>
          </div>

          {/* Masking Tape Decor */}
          <div className="absolute -bottom-6 -left-8 w-32 h-10 masking-tape -rotate-12 z-20" />
        </motion.div>

        {/* Torn Paper Item */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-7 mt-8 md:-mt-10"
        >
          <div className="mask-torn-paper bg-white p-10 pt-16 pb-20 shadow-xl relative">
            {/* Tape holding it */}
            <div className="absolute top-0 right-1/4 w-12 h-20 masking-tape rotate-6 -translate-y-6" />

            <p className="font-anton text-3xl md:text-4xl text-hot-pink uppercase leading-none">
              LA VIDA SE DISFRUTA<br/>
              <span className="text-black bg-neon-green px-2 ml-4">EN MOVIMIENTO</span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
