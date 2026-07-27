'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Categoria, Producto } from '@/types/database';

interface TiendaClientProps {
  initialUser: { id: string; email?: string | null } | null;
  alumnoName: string;
  categorias: Categoria[];
  productos: Producto[];
}

export default function TiendaClient({
  categorias,
  productos
}: TiendaClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  // Set category from URL if present
  useEffect(() => {
    const catParam = searchParams.get('categoria');
    if (catParam) {
      setSelectedCategoria(catParam);
    }
  }, [searchParams]);

  // Filter products
  const filteredProductos = productos.filter((prod) => {
    // Category filter
    if (selectedCategoria !== 'todos') {
      const slugMatch = prod.categoria?.slug === selectedCategoria || prod.categoria?.nombre.toLowerCase() === selectedCategoria;
      if (!slugMatch) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white font-space antialiased selection:bg-white selection:text-black">
      {/* Hero Header */}
      <header className="pt-32 pb-16 px-6 md:px-12 text-center max-w-4xl mx-auto space-y-4">
        <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.4em] block">Colección Oficial</span>
        <h1 className="font-anton text-5xl md:text-7xl uppercase leading-none tracking-tight">TRAVESÍA STORE</h1>
        <p className="font-space text-sm md:text-base text-white/60 max-w-xl mx-auto leading-relaxed">
          Prendas y accesorios diseñados para rodar con estilo, confort y durabilidad.
        </p>
      </header>

      {/* Mostrar filtros solo si hay más de una categoría */}
      {categorias && categorias.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }} className="max-w-7xl mx-auto px-6 md:px-12">
          <button
            onClick={() => { setSelectedCategoria('todos'); router.push('/tienda'); }}
            style={{
              background: selectedCategoria === 'todos' ? '#00ff88' : 'transparent',
              color: selectedCategoria === 'todos' ? '#000' : '#fff',
              border: '1px solid #333',
              padding: '8px 20px',
              fontFamily: 'Space Grotesk',
              fontSize: '13px',
              letterSpacing: '2px',
              cursor: 'pointer',
              borderRadius: '4px',
            }}>
            TODOS
          </button>

          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategoria(cat.slug); router.push(`/tienda?categoria=${cat.slug}`); }}
              style={{
                background: selectedCategoria === cat.slug ? '#00ff88' : 'transparent',
                color: selectedCategoria === cat.slug ? '#000' : '#fff',
                border: '1px solid #333',
                padding: '8px 20px',
                fontFamily: 'Space Grotesk',
                fontSize: '13px',
                letterSpacing: '2px',
                cursor: 'pointer',
                borderRadius: '4px',
              }}>
              {cat.nombre.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        {productos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: '#555', fontFamily: 'Space Grotesk', fontSize: '18px' }}>
              Próximamente nuevos productos
            </p>
          </div>
        ) : filteredProductos.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-white/40 uppercase tracking-widest text-sm">No se encontraron productos</p>
            <button
              onClick={() => { setSelectedCategoria('todos'); router.push('/tienda'); }}
              className="border border-white/20 px-6 py-3 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProductos.map((prod) => {
              const fotos = prod.fotos || [];
              const principalFoto = fotos.find((f) => f.es_principal)?.url || fotos[0]?.url;
              const hoverFoto = fotos.find((f) => !f.es_principal && f.orden > 0)?.url || principalFoto;
              const hasDescuento = prod.precio_descuento !== null && prod.precio_descuento !== undefined && prod.precio_descuento < prod.precio;

              return (
                <div
                  key={prod.id}
                  className="group flex flex-col justify-between"
                  onMouseEnter={() => setHoverProduct(prod.id)}
                  onMouseLeave={() => setHoverProduct(null)}
                >
                  <Link href={`/tienda/${prod.slug}`} className="block space-y-4 cursor-pointer">
                    {/* Image Area - Zero borders/shadows, Apple style */}
                    <div className="aspect-[3/4] bg-neutral-900 overflow-hidden relative">
                      {principalFoto ? (
                        <>
                          <img
                            src={principalFoto}
                            alt={prod.nombre}
                            className={`object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105 ${
                              hoveredProduct === prod.id && hoverFoto ? 'opacity-0' : 'opacity-100'
                            }`}
                          />
                          {hoverFoto && hoveredProduct === prod.id && (
                            <img
                              src={hoverFoto}
                              alt={prod.nombre}
                              className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105 absolute inset-0 opacity-100"
                            />
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-widest text-white/20">
                          Sin Foto
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {prod.agotado && (
                          <span className="bg-red-600 text-white font-mono text-[9px] font-bold px-2 py-1 uppercase tracking-widest">
                            AGOTADO
                          </span>
                        )}
                        {prod.nuevo && !prod.agotado && (
                          <span className="bg-white text-black font-mono text-[9px] font-bold px-2 py-1 uppercase tracking-widest">
                            NUEVO
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Typography - Pure space and text */}
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">{prod.categoria?.nombre}</p>
                      <h3 className="font-bold text-base leading-tight text-white group-hover:text-neon-green transition-colors">
                        {prod.nombre}
                      </h3>
                      <div className="flex items-center gap-3 pt-1">
                        {hasDescuento ? (
                          <>
                            <span className="text-white/40 line-through text-xs font-mono">
                              ${prod.precio.toLocaleString('es-CO')}
                            </span>
                            <span className="text-neon-green text-sm font-bold font-mono">
                              ${prod.precio_descuento?.toLocaleString('es-CO')}
                            </span>
                          </>
                        ) : (
                          <span className="text-white text-sm font-bold font-mono">
                            ${prod.precio.toLocaleString('es-CO')}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );

  function setHoverProduct(id: string | null) {
    setHoveredProduct(id);
  }
}
