'use client';

import { motion } from 'framer-motion';

export default function UneteSection() {
  return (
    <section id="unete" className="py-32 px-6 relative bg-black overflow-hidden border-t-8 border-neon-green">
      {/* Grain texture */}
      <div className="absolute inset-0 bg-grain pointer-events-none opacity-20" />

      {/* Decorative vertical lines */}
      <div className="absolute left-10 top-0 bottom-0 w-px bg-white/5 hidden md:block" />
      <div className="absolute right-10 top-0 bottom-0 w-px bg-white/5 hidden md:block" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-anton text-6xl md:text-9xl text-white uppercase mb-4 tracking-tighter leading-none">
            ¿LISTO PARA<br/>
            <span className="text-neon-green">EL PARCHE?</span>
          </h2>

          <p className="font-space text-xl md:text-3xl text-white/60 mb-12 uppercase tracking-wide">
            Escríbenos y empieza esta semana.
          </p>

          <div className="flex justify-center">
            <motion.a
              href="https://wa.me/573202027777?text=Hola,%20quiero%20unirme%20al%20Club%20de%20Patinaje%20Travesía"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, rotate: -1 }}
              whileTap={{ scale: 0.95 }}
              className="group relative"
            >
              {/* Brutal shadow behind button */}
              <div className="absolute inset-0 bg-hot-pink translate-x-3 translate-y-3" />

              <div className="relative bg-neon-green text-black font-anton text-2xl md:text-4xl py-6 px-12 flex items-center gap-4 border-4 border-black">
                <svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8 md:w-10 md:h-10 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                HABLEMOS POR WHATSAPP
              </div>
            </motion.a>
          </div>
        </motion.div>
      </div>

      {/* Decorative dots */}
      <div className="absolute bottom-4 right-4 grid grid-cols-4 gap-2 opacity-20">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="w-2 h-2 bg-neon-green rounded-full" />
        ))}
      </div>
    </section>
  );
}
