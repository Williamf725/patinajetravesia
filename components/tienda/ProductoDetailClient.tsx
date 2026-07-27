'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Producto } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, ShoppingBag, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProductoDetailClientProps {
  producto: Producto;
  initialUser: { id: string; email?: string | null } | null;
  alumnoName: string;
}

export default function ProductoDetailClient({
  producto,
  initialUser
}: ProductoDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState(initialUser);
  const [selectedTalla, setSelectedTalla] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedFotoUrl, setSelectedFotoUrl] = useState<string>('');

  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

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

  // Set initial selected photo
  useEffect(() => {
    if (producto.fotos && producto.fotos.length > 0) {
      const principal = producto.fotos.find(f => f.es_principal) || producto.fotos[0];
      setSelectedFotoUrl(principal.url);
    }
  }, [producto]);

  const handleAddToCart = async () => {
    // 1. Verificar sesión primero
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      // Redirigir a login con redirect de vuelta al producto
      router.push(`/login?redirect=/tienda/${producto.slug}`);
      return;
    }

    if (!selectedTalla) {
      setError('Selecciona una talla antes de agregar al carrito');
      toast.error('Selecciona una talla antes de agregar al carrito');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      // Usar upsert según lo solicitado en el prompt con onConflict e ignoreDuplicates
      const { error: upsertError } = await supabase
        .from('carrito')
        .upsert({
          user_id: currentUser.id,
          producto_id: producto.id,
          talla: selectedTalla,
          color: selectedColor || null,
          cantidad: 1
        }, {
          onConflict: 'user_id,producto_id,talla,color',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('Error agregando al carrito:', upsertError.message, upsertError.code);
        setError('Error al agregar al carrito. Intenta de nuevo.');
        toast.error('Error al agregar al carrito. Intenta de nuevo.');
        return;
      }

      setMensaje('✅ Agregado al carrito');
      toast.success('✅ Agregado al carrito');

      // Actualizar contador del carrito en navbar
      window.dispatchEvent(new CustomEvent('carrito-actualizado'));

      setTimeout(() => setMensaje(null), 3000);

    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Error inesperado. Intenta de nuevo.');
      toast.error('Error inesperado. Intenta de nuevo.');
    } finally {
      setIsAdding(false);
    }
  };

  const handlePedirPorWhatsApp = () => {
    const tallaText = selectedTalla ? `en talla [${selectedTalla}]` : '';
    const colorText = selectedColor ? `y color [${selectedColor}]` : '';
    const msg = `¡Hola! Estoy interesado en el producto *${producto.nombre}* ${tallaText} ${colorText} de Travesía Club.`;
    window.open(`https://wa.me/573222508676?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const hasDescuento = producto.precio_descuento !== null && producto.precio_descuento !== undefined && producto.precio_descuento < producto.precio;

  const fotos = producto.fotos || [];
  const tallas = producto.tallas || [];
  const colores = producto.colores || [];

  return (
    <div className="min-h-screen bg-black text-white font-space antialiased selection:bg-white selection:text-black">
      {/* Detail Container */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-24">
        {/* Back Link */}
        <Link href="/tienda" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors mb-12">
          <ArrowLeft size={14} /> Regresar a Tienda
        </Link>

        {user && <span className="sr-only">Logged in as {user.email}</span>}

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20">

          {/* Left Column: Image Gallery (Apple style layout) */}
          <div className="space-y-6">
            <div className="aspect-[3/4] bg-neutral-900 overflow-hidden relative">
              {selectedFotoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={selectedFotoUrl} alt={producto.nombre} className="object-cover w-full h-full transition-all duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-widest text-white/20">Sin Imagen</div>
              )}
            </div>

            {/* Thumbnail Miniatures */}
            {fotos.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {fotos.map((f) => (
                  <button
                    key={f.url}
                    onClick={() => setSelectedFotoUrl(f.url)}
                    className={`aspect-[3/4] w-20 bg-neutral-900 overflow-hidden border-2 transition-all shrink-0 ${
                      selectedFotoUrl === f.url ? 'border-white' : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={f.alt || producto.nombre} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Specs */}
          <div className="space-y-8 text-left">
            <div>
              <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-2">{producto.categoria?.nombre}</p>
              <h1 className="font-anton text-4xl md:text-5xl uppercase leading-none tracking-tight mb-4">{producto.nombre}</h1>

              <div className="flex items-center gap-4">
                {hasDescuento ? (
                  <>
                    <span className="text-white/40 line-through text-lg font-mono">${producto.precio.toLocaleString('es-CO')}</span>
                    <span className="text-neon-green text-2xl font-bold font-mono">${producto.precio_descuento?.toLocaleString('es-CO')} COP</span>
                  </>
                ) : (
                  <span className="text-white text-2xl font-bold font-mono">${producto.precio.toLocaleString('es-CO')} COP</span>
                )}
              </div>
            </div>

            {producto.descripcion && (
              <p className="text-white/60 text-sm md:text-base leading-relaxed font-space border-y border-white/10 py-6">
                {producto.descripcion}
              </p>
            )}

            {/* Size Selector: Pill-style button layout */}
            {tallas.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] text-white/40 uppercase tracking-widest block font-mono">Tallas Disponibles</span>
                <div className="flex flex-wrap gap-3">
                  {tallas.map((t) => {
                    const isAvailable = t.disponible && t.stock > 0;
                    const isSelected = selectedTalla === t.talla;

                    if (!isAvailable) {
                      return (
                        <button
                          key={t.talla}
                          disabled
                          className="relative w-12 h-12 rounded-full border border-white/5 flex items-center justify-center text-xs text-white/20 font-bold bg-transparent overflow-hidden cursor-not-allowed opacity-30 after:absolute after:inset-0 after:bg-white/40 after:h-[1px] after:w-full after:top-1/2 after:-translate-y-1/2 after:rotate-[45deg]"
                        >
                          {t.talla}
                        </button>
                      );
                    }

                    return (
                      <button
                        key={t.talla}
                        onClick={() => setSelectedTalla(t.talla)}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-white text-black border-white'
                            : 'bg-black text-white border-white/20 hover:border-white'
                        }`}
                      >
                        {t.talla}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selector: Circles with hex value, white ring on selected */}
            {colores.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] text-white/40 uppercase tracking-widest block font-mono">Color</span>
                <div className="flex flex-wrap gap-4">
                  {colores.map((c) => {
                    const isSelected = selectedColor === c.nombre;
                    return (
                      <button
                        key={c.nombre}
                        onClick={() => setSelectedColor(c.nombre)}
                        style={{ backgroundColor: c.hex }}
                        className={`w-8 h-8 rounded-full border border-white/20 transition-all ${
                          isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105' : 'hover:scale-105'
                        }`}
                        title={c.nombre}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback Messages */}
            {error && (
              <div className="p-3 bg-hot-pink/10 border-l-4 border-hot-pink text-hot-pink font-mono text-[10px] uppercase tracking-wider">
                {error}
              </div>
            )}

            {mensaje && (
              <div className="p-3 bg-neon-green/10 border-l-4 border-neon-green text-neon-green font-mono text-[10px] uppercase tracking-wider">
                {mensaje}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4 pt-6">
              {producto.agotado ? (
                <button
                  disabled
                  className="w-full bg-neutral-900 text-white/20 font-anton tracking-widest text-sm py-4 uppercase cursor-not-allowed text-center"
                >
                  PRODUCTO AGOTADO
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full bg-white text-black font-anton tracking-widest text-sm py-4 uppercase hover:bg-neon-green hover:text-black transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} /> {isAdding ? 'AÑADIENDO...' : 'AGREGAR AL CARRITO'}
                </button>
              )}

              <button
                onClick={handlePedirPorWhatsApp}
                className="w-full bg-transparent border border-white/20 text-white font-anton tracking-widest text-sm py-4 uppercase hover:border-white transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare size={16} /> PEDIR POR WHATSAPP
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
