'use client';

import { motion } from 'framer-motion';

const HORARIOS = [
  {
    dia: 'MARTES',
    hora: '7:00 PM a 9:00 PM',
    color: 'border-hot-pink',
    rot: -1
  },
  {
    dia: 'MIÉRCOLES',
    hora: '2:30 PM a 4:30 PM',
    color: 'border-neon-green',
    rot: -2
  },
  {
    dia: 'JUEVES',
    hora: '6:30 PM a 8:30 PM',
    color: 'border-hot-pink',
    rot: 1
  },
  {
    dia: 'SÁBADO',
    hora: '4:00 PM a 6:00 PM',
    color: 'border-neon-green',
    rot: -1
  }
];

export default function EntrenamientosSection() {
  return (
    <section id="entrenamientos" className="py-16 md:py-24 px-6 relative bg-metal-oxidized overflow-hidden">
      {/* Texture grains on top */}
      <div className="absolute inset-0 bg-grain pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="font-anton text-4xl md:text-6xl text-white uppercase leading-none tracking-tighter">
            HORARIOS<br/>
            <span className="text-neon-green">DE ENTRENAMIENTO</span>
          </h2>
          <div className="w-16 h-3 bg-hot-pink mt-3 shadow-brutal" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
          {HORARIOS.map((h, i) => (
            <motion.div
              key={h.dia}
              initial={{ opacity: 0, y: 100, rotate: 10 }}
              whileInView={{
                opacity: 1,
                y: 0,
                rotate: h.rot,
                transition: {
                  type: "spring",
                  damping: 12,
                  stiffness: 100,
                  delay: i * 0.2
                }
              }}
              viewport={{ once: true }}
              className="relative group"
            >
              {/* The "Nail" */}
              <div className="absolute top-4 left-4 z-20">
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" fill="#555" />
                  <circle cx="9" cy="9" r="3" fill="#888" />
                  <circle cx="10" cy="10" r="8" fill="none" stroke="#222" strokeWidth="1" />
                </svg>
              </div>

              {/* The Card */}
              <div className={`bg-[#131313] p-6 pt-10 border-t-[8px] ${h.color} shadow-brutal transition-transform group-hover:scale-105 duration-300`}>
                <div className="font-mono text-[9px] text-white/40 uppercase mb-1 tracking-[0.3em]">Sesión Club</div>
                <h3 className="font-anton text-3xl text-white mb-1">{h.dia}</h3>
                <p className="font-space text-lg text-white/80">{h.hora}</p>

                <div className="mt-6 flex justify-end">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] border-2 ${h.color} text-white opacity-40`}>
                    {i + 1}
                  </span>
                </div>
              </div>

              {/* Red marker detail */}
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-neon-orange/20 rounded-full blur-xl pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Salidas a ruta */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 bg-[#131313] border-l-[8px] border-neon-orange p-6 md:p-8 shadow-brutal"
        >
          <div className="font-mono text-[9px] text-white/40 uppercase mb-1 tracking-[0.3em]">Adicional</div>
          <h3 className="font-anton text-2xl md:text-3xl text-white uppercase mb-2">
            Salidas a <span className="text-neon-orange">Ruta</span>
          </h3>
          <p className="font-space text-white/80 text-sm md:text-base max-w-2xl">
            Hacemos al menos una salida a ruta al mes — a veces dos, según disponibilidad.
            ¡Súmate y patina la ciudad con el club!
          </p>
        </motion.div>
      </div>
    </section>
  );
}
