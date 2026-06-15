'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const navLinks = [
  { name: 'La Historia', href: '#' },
  { name: 'Entrenamientos', href: '#' },
  { name: 'Galería', href: '#' },
  { name: 'Únete', href: '#' },
];

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-8"
    >
      <div className="flex gap-6 md:gap-10">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="nav-link text-xs md:text-sm tracking-widest"
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div>
        <button className="btn-tape !bg-neon-orange text-black border-black text-xs md:text-sm px-4 py-2">
          ÚNETE AL CLUB
        </button>
      </div>
    </motion.nav>
  );
}
