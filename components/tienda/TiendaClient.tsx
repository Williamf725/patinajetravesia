'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Categoria, Producto, CarritoItem } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import TiendaNavbar from './TiendaNavbar';
import TiendaCartDrawer from './TiendaCartDrawer';

interface TiendaClientProps {
  initialUser: { id: string; email?: string | null } | null;
  alumnoName: string;
  categorias: Categoria[];
  productos: Producto[];
}

export default function TiendaClient({
  initialUser,
  alumnoName,
  categorias,
  productos
}: TiendaClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState(initialUser);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos');
  const [selectedGenero, setSelectedGenero] = useState<'todos' | 'hombre' | 'mujer'>('todos');

  // Cart state
  const [cartItems, setCartItems] = useState<CarritoItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  // Sync user status on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
      }
    };
    getUser();
  }, [supabase]);

  // Set category from URL if present
  useEffect(() => {
    const catParam = searchParams.get('categoria');
    if (catParam) {
      setSelectedCategoria(catParam);
    }
  }, [searchParams]);

  // Load cart items from Supabase
  const loadCart = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('carrito')
        .select(`
          *,
          producto:productos(
            *,
            fotos:producto_fotos(*)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems((data || []) as CarritoItem[]);
    } catch (err) {
      console.error('Error loading cart:', err);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Total cart count
  const cartCount = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

  // Filter products
  const filteredProductos = productos.filter((prod) => {
    // Category filter
    if (selectedCategoria !== 'todos') {
      const slugMatch = prod.categoria?.slug === selectedCategoria || prod.categoria?.nombre.toLowerCase() === selectedCategoria;
      if (!slugMatch) return false;
    }

    // Gender filter
    if (selectedGenero !== 'todos') {
      const txt = `${prod.nombre} ${prod.descripcion || ''}`.toLowerCase();
      const isMatch = txt.includes(selectedGenero) || txt.includes('unisex');
      if (!isMatch) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white font-space antialiased selection:bg-white selection:text-black">
      {/* Navbar */}
      <TiendaNavbar cartCount={cartCount} onCartOpen={() => setIsCartOpen(true)} />

      {/* Hero Header */}
      <header className="pt-32 pb-16 px-6 md:px-12 text-center max-w-4xl mx-auto space-y-4">
        <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.4em] block">Colección Oficial</span>
        <h1 className="font-anton text-5xl md:text-7xl uppercase leading-none tracking-tight">TRAVESÍA STORE</h1>
        <p className="font-space text-sm md:text-base text-white/60 max-w-xl mx-auto leading-relaxed">
          Prendas y accesorios diseñados para rodar con estilo, confort y durabilidad.
        </p>
      </header>

      {/* Filter bar - Minimalist Apple style */}
      <div className="border-y border-white/5 py-4 mb-12 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between gap-8 min-w-max">
          {/* Categories filter */}
          <div className="flex items-center gap-6 text-xs uppercase tracking-widest font-mono">
            <button
              onClick={() => { setSelectedCategoria('todos'); router.push('/tienda'); }}
              className={`pb-1 transition-colors ${selectedCategoria === 'todos' ? 'text-neon-green border-b border-neon-green' : 'text-white/40 hover:text-white'}`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategoria(cat.slug); router.push(`/tienda?categoria=${cat.slug}`); }}
                className={`pb-1 transition-colors ${selectedCategoria === cat.slug ? 'text-neon-green border-b border-neon-green' : 'text-white/40 hover:text-white'}`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-6 text-xs uppercase tracking-widest font-mono">
            {(['todos', 'hombre', 'mujer'] as const).map((gen) => (
              <button
                key={gen}
                onClick={() => setSelectedGenero(gen)}
                className={`pb-1 transition-colors ${selectedGenero === gen ? 'text-white font-bold' : 'text-white/40 hover:text-white'}`}
              >
                {gen === 'todos' ? 'Todo Género' : gen}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        {filteredProductos.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-white/40 uppercase tracking-widest text-sm">No se encontraron productos</p>
            <button
              onClick={() => { setSelectedCategoria('todos'); setSelectedGenero('todos'); }}
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

      {/* Cart Sidebar Drawer */}
      <TiendaCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRefreshCart={loadCart}
        user={user}
        alumnoName={alumnoName}
      />
    </div>
  );

  function setHoverProduct(id: string | null) {
    setHoveredProduct(id);
  }
}
