'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const Background = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Desktop Background */}
      <div className="hidden md:block absolute inset-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative w-full h-full"
        >
          <Image
            src="https://res.cloudinary.com/dvpnkr2i9/image/upload/v1781321678/fondo_bh7igj.jpg"
            alt="Club de Patinaje Travesía Background"
            fill
            priority
            className="object-cover grayscale-40 brightness-60"
          />
        </motion.div>
      </div>

      {/* Mobile Background */}
      <div className="block md:hidden absolute inset-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative w-full h-full"
        >
          <Image
            src="https://res.cloudinary.com/dvpnkr2i9/image/upload/v1781321680/FondoMovil_c9y8a3.jpg"
            alt="Club de Patinaje Travesía Background Mobile"
            fill
            priority
            className="object-cover grayscale-40 brightness-60"
          />
        </motion.div>
      </div>

      {/* Brutalist Overlay / Grain (Optional but adds 'expensive' feel) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default Background;
