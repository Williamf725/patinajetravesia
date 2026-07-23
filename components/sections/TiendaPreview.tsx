'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function TiendaPreview() {
  const categorias = ['Camisetas', 'Sudaderas', 'Pantalones'];

  return (
    /* Sección preview tienda */
    <section id="tienda-preview" style={{ background: '#000', padding: '120px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Logo marca */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784734270/40930-removebg-preview_bmvhkt.png"
            style={{ height: '80px', marginBottom: '48px' }}
            alt="Travesía"
          />

          {/* Título estilo Apple */}
          <h2 style={{ fontFamily: 'Anton', fontSize: 'clamp(48px, 8vw, 96px)', color: '#fff',
            margin: '0 0 24px', letterSpacing: '-2px', lineHeight: 1 }}>
            VISTE EL MOVIMIENTO.
          </h2>
          <p style={{ color: '#888', fontSize: '20px', fontFamily: 'Space Grotesk',
            margin: '0 0 64px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            {/* Subtítulo tienda */}
            Ropa de patinaje diseñada para quienes no se detienen. Para hombre y mujer.
          </p>
        </motion.div>

        {/* Grid de categorías */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2px', marginBottom: '64px' }}>
          {categorias.map((cat, i) => (
            <motion.a
              key={cat}
              href={`/tienda?categoria=${cat.toLowerCase()}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.2, ease: "easeOut" }}
              style={{ display: 'block', position: 'relative', aspectRatio: '3/4',
              background: '#111', overflow: 'hidden', textDecoration: 'none' }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <div style={{ position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'flex-end', padding: '32px' }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: '#666', fontSize: '12px', letterSpacing: '4px',
                    margin: '0 0 8px', fontFamily: 'Space Grotesk' }}>
                    {i === 0 ? 'NUEVA COLECCIÓN' : i === 1 ? 'BESTSELLER' : 'ESENCIALES'}
                  </p>
                  <h3 style={{ color: '#fff', fontFamily: 'Anton', fontSize: '32px', margin: 0 }}>
                    {cat.toUpperCase()}
                  </h3>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        <motion.a
          href="/tienda"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{ display: 'inline-block', border: '1px solid #fff', color: '#fff',
          padding: '16px 48px', fontFamily: 'Space Grotesk', fontSize: '14px',
          letterSpacing: '4px', textDecoration: 'none', transition: 'all 0.3s' }}
          className="hover:bg-white hover:text-black"
        >
          {/* CTA tienda */}
          VER COLECCIÓN COMPLETA
        </motion.a>
      </div>
    </section>
  );
}
