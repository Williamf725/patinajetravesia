'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function TiendaPreviewHeader() {
  return (
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
      <h2 style={{
        fontFamily: 'Anton',
        fontSize: 'clamp(48px, 8vw, 96px)',
        color: '#fff',
        margin: '0 0 24px',
        letterSpacing: '-2px',
        lineHeight: 1,
      }}>
        VISTE EL MOVIMIENTO.
      </h2>
      <p style={{
        color: '#888',
        fontSize: '20px',
        fontFamily: 'Space Grotesk',
        margin: '0 0 64px',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto',
        lineHeight: 1.6,
      }}>
        Ropa de patinaje diseñada para quienes no se detienen. Para hombre y mujer.
      </p>
    </motion.div>
  );
}

export function TiendaPreviewButton() {
  return (
    <motion.a
      href="/tienda"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.6 }}
      style={{
        display: 'inline-block',
        border: '1px solid #fff',
        color: '#fff',
        padding: '16px 48px',
        fontFamily: 'Space Grotesk',
        fontSize: '14px',
        letterSpacing: '4px',
        textDecoration: 'none',
        transition: 'all 0.3s',
      }}
      className="hover:bg-white hover:text-black"
    >
      VER COLECCIÓN COMPLETA
    </motion.a>
  );
}
