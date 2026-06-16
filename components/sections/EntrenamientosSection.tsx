'use client';

import { motion } from 'framer-motion';

const HORARIOS = [
  {
    dia: 'MIÉRCOLES',
    hora: '2:30 PM a 4:30 PM',
    color: 'border-neon-green',
    rot: -2
  },
  {
    dia: 'JUEVES',
    hora: '6:00 PM a 8:00 PM',
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
    <section id="entrenamientos" className="py-32 px-6 relative bg-metal-oxidized overflow-hidden">
      {/* Texture grains on top */}
      <div className="absolute inset-0 bg-grain pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="font-anton text-6xl md:text-8xl text-white uppercase leading-none tracking-tighter">
            HORARIOS<br/>
            <span className="text-neon-green">DE ENTRENAMIENTO</span>
          </h2>
          <div className="w-24 h-4 bg-hot-pink mt-4 shadow-brutal" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
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
              <div className={`bg-[#131313] p-8 pt-12 border-t-[12px] ${h.color} shadow-brutal-lg transition-transform group-hover:scale-105 duration-300`}>
                <div className="font-mono text-[10px] text-white/40 uppercase mb-2 tracking-[0.4em]">Sesión Club</div>
                <h3 className="font-anton text-4xl text-white mb-2">{h.dia}</h3>
                <p className="font-space text-xl text-white/80">{h.hora}</p>

                <div className="mt-8 flex justify-end">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs border-2 ${h.color} text-white opacity-40`}>
                    {i + 1}
                  </span>
                </div>
              </div>

              {/* Red marker detail */}
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-neon-orange/20 rounded-full blur-xl pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
