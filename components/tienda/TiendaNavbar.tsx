'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

interface TiendaNavbarProps {
  cartCount: number;
  onCartOpen: () => void;
}

export default function TiendaNavbar({ cartCount, onCartOpen }: TiendaNavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
      <Link href="/" className="font-anton text-2xl text-white tracking-tighter hover:opacity-85 transition-opacity">
        TRAVESÍA<span className="text-neon-green">.</span>
      </Link>

      <div className="flex items-center gap-8">
        <Link href="/" className="font-space text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors">
          CLUB
        </Link>
        <button
          onClick={onCartOpen}
          className="relative text-white hover:text-neon-green transition-colors flex items-center gap-1.5 p-2"
          aria-label="Ver Carrito"
        >
          <ShoppingBag size={18} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-neon-green text-black font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
