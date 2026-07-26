'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface FotoProducto {
  url: string;
  alt: string | null;
  es_principal: boolean;
}

interface ProductoPreview {
  id: string;
  nombre: string;
  slug: string;
  descripcion_corta: string | null;
  precio: number;
  fotos: FotoProducto[];
}

interface TiendaCarouselProps {
  productos: ProductoPreview[];
}

export default function TiendaCarousel({ productos }: TiendaCarouselProps) {
  const [duration, setDuration] = useState('30s');
  const [direction, setDirection] = useState('normal');

  // Duplicar los productos para el loop infinito del carrusel CSS
  const productosDuplicados = [...productos, ...productos];

  // Flecha Izquierda: Cambia dirección a reversa y acelera
  const handleLeftArrowEnter = () => {
    setDirection('reverse');
    setDuration('12s');
  };

  // Flecha Derecha: Dirección normal y acelera
  const handleRightArrowEnter = () => {
    setDirection('normal');
    setDuration('12s');
  };

  // Al quitar el mouse de las flechas, vuelve a velocidad normal
  const handleArrowLeave = () => {
    setDuration('30s');
    setDirection('normal');
  };

  return (
    <div className="relative w-full overflow-hidden py-10 select-none">
      <style>{`
        @keyframes scroll-carrusel {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .carrusel-container {
          width: 100%;
          overflow: hidden;
          position: relative;
        }

        .carrusel-track {
          display: flex;
          width: max-content;
          animation: scroll-carrusel var(--carousel-duration, 30s) linear infinite;
          animation-direction: var(--carousel-direction, normal);
          animation-play-state: var(--carousel-play-state, running);
        }

        /* Pausa el carrusel completo en hover */
        .carrusel-track:hover {
          animation-play-state: paused;
        }

        /* Ancho responsivo de cada tarjeta para cumplir con la visualización */
        .carrusel-item {
          width: calc(100vw - 48px);
          margin-right: 16px;
          flex-shrink: 0;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (min-width: 640px) {
          .carrusel-item {
            width: calc((100vw - 48px - 16px) / 2);
            margin-right: 16px;
          }
        }

        @media (min-width: 1024px) {
          .carrusel-item {
            width: calc((1200px - 64px) / 3);
            margin-right: 32px;
          }
        }

        @media (min-width: 1200px) {
          .carrusel-item {
            width: 378.66px;
            margin-right: 32px;
          }
        }

        /* Hover de tarjetas */
        .carrusel-item:hover .card-hover-overlay {
          opacity: 1 !important;
        }

        .carrusel-item:hover img {
          transform: scale(1.05);
        }

        /* En dispositivos táctiles habilitamos swipe natural */
        @media (hover: none) {
          .carrusel-container {
            overflow-x: auto;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }
          .carrusel-track {
            animation: none !important;
          }
        }
      `}</style>

      {/* Flechas de navegación (ocultas en móviles, visibles en desktop) */}
      <div className="absolute inset-y-0 left-4 z-20 hidden md:flex items-center pointer-events-none">
        <button
          onMouseEnter={handleLeftArrowEnter}
          onMouseLeave={handleArrowLeave}
          onClick={() => {
            setDirection('reverse');
            setDuration('6s'); // Aceleración extra al hacer click
          }}
          className="pointer-events-auto w-12 h-12 bg-black/60 hover:bg-neon-green hover:text-black border border-white/20 hover:border-transparent text-white rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer"
          title="Retroceder rápido"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="absolute inset-y-0 right-4 z-20 hidden md:flex items-center pointer-events-none">
        <button
          onMouseEnter={handleRightArrowEnter}
          onMouseLeave={handleArrowLeave}
          onClick={() => {
            setDirection('normal');
            setDuration('6s'); // Aceleración extra al hacer click
          }}
          className="pointer-events-auto w-12 h-12 bg-black/60 hover:bg-neon-green hover:text-black border border-white/20 hover:border-transparent text-white rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer"
          title="Avanzar rápido"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Contenedor del Carrusel */}
      <div className="carrusel-container">
        <div
          className="carrusel-track"
          style={{
            '--carousel-duration': duration,
            '--carousel-direction': direction,
            '--carousel-play-state': 'running',
          } as React.CSSProperties}
        >
          {productosDuplicados.map((producto, i) => {
            // Buscar foto principal o la primera
            const fotoProducto = producto.fotos.find(f => f.es_principal) || producto.fotos[0];

            return (
              <div key={`${producto.id}-${i}`} className="carrusel-item">
                <Link href={`/tienda/${producto.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    position: 'relative',
                    aspectRatio: '3/4',
                    overflow: 'hidden',
                    background: '#111',
                    cursor: 'pointer',
                  }}>
                    {/* Foto del producto */}
                    {fotoProducto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={fotoProducto.url}
                        alt={fotoProducto.alt || producto.nombre}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.6s ease',
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500 font-mono text-xs">
                        SIN IMAGEN
                      </div>
                    )}

                    {/* Overlay gradiente inferior */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                      padding: '24px 16px 16px',
                    }}>
                      <h3 style={{
                        color: '#fff',
                        fontFamily: 'Anton',
                        fontSize: '20px',
                        margin: '0 0 4px',
                        letterSpacing: '1px',
                      }}>
                        {producto.nombre}
                      </h3>
                      {producto.descripcion_corta && (
                        <p style={{
                          color: '#aaa',
                          fontSize: '13px',
                          margin: '0 0 8px',
                          fontFamily: 'Space Grotesk',
                          lineHeight: 1.4,
                        }}>
                          {producto.descripcion_corta}
                        </p>
                      )}
                      {producto.precio > 0 && (
                        <p style={{
                          color: '#00ff88',
                          fontSize: '16px',
                          margin: 0,
                          fontFamily: 'Space Grotesk',
                          fontWeight: 'bold',
                        }}>
                          ${producto.precio.toLocaleString('es-CO')} COP
                        </p>
                      )}
                    </div>

                    {/* Hover overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,255,136,0.05)',
                        opacity: 0,
                        transition: 'opacity 0.3s',
                      }}
                      className="card-hover-overlay"
                    />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
