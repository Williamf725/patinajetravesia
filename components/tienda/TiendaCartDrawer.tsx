'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { CarritoItem } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface TiendaCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CarritoItem[];
  onRefreshCart: () => void;
  user: { id: string; email?: string | null } | null;
  alumnoName?: string;
}

export default function TiendaCartDrawer({
  isOpen,
  onClose,
  cartItems,
  onRefreshCart,
  user,
  alumnoName
}: TiendaCartDrawerProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const total = cartItems.reduce((acc, item) => {
    const price = item.producto?.precio_descuento || item.producto?.precio || 0;
    return acc + price * item.cantidad;
  }, 0);

  const handleUpdateCantidad = async (itemId: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    try {
      const { error } = await supabase
        .from('carrito')
        .update({ cantidad: nuevaCantidad })
        .eq('id', itemId);

      if (error) throw error;
      onRefreshCart();
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar cantidad');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('carrito')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      toast.success('Producto eliminado del carrito');
      onRefreshCart();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar producto');
    }
  };

  const handleFinalizarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ciudad || !direccion) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Pedido record
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          user_id: user?.id || null,
          nombre_alumno: alumnoName || user?.email || 'Cliente',
          ciudad,
          direccion,
          total,
          estado: 'pendiente'
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // 2. Create Pedido Items
      const itemsToInsert = cartItems.map(item => ({
        pedido_id: pedido.id,
        producto_id: item.producto_id,
        talla: item.talla,
        color: item.color,
        cantidad: item.cantidad,
        precio: item.producto?.precio_descuento || item.producto?.precio || 0
      }));

      const { error: itemsError } = await supabase
        .from('pedido_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // 3. Clear Cart
      const { error: clearCartError } = await supabase
        .from('carrito')
        .delete()
        .eq('user_id', user?.id);

      if (clearCartError) throw clearCartError;

      // 4. Generate WhatsApp Message
      let msg = `Hola! Quiero hacer un pedido de Travesía:\n`;
      cartItems.forEach(item => {
        const itemPrice = item.producto?.precio_descuento || item.producto?.precio || 0;
        msg += `- ${item.producto?.nombre} talla [${item.talla}] color [${item.color}] x${item.cantidad} — $${itemPrice.toLocaleString('es-CO')}\n`;
      });
      msg += `Total: $${total.toLocaleString('es-CO')}\n`;
      msg += `Nombre: ${alumnoName || user?.email || 'Cliente'}\n`;
      msg += `Ciudad: ${ciudad}\n`;
      msg += `Dirección: ${direccion}`;

      const waUrl = `https://wa.me/573222508676?text=${encodeURIComponent(msg)}`;

      toast.success('¡Pedido creado con éxito! Redirigiendo a WhatsApp...');
      onRefreshCart();
      setIsCheckoutOpen(false);
      onClose();
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error(err);
      toast.error('Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 cursor-pointer"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-black border-l border-white/10 z-50 p-6 md:p-8 flex flex-col text-white font-space"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-neon-green" />
                <h2 className="font-anton text-2xl uppercase tracking-wider">TU CARRITO</h2>
              </div>
              <button onClick={onClose} className="hover:text-neon-green transition-colors">
                <X size={20} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <p className="text-white/40 uppercase tracking-widest text-sm">Tu carrito está vacío</p>
                <button
                  onClick={onClose}
                  className="border border-white/20 text-xs px-6 py-3 uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  Continuar comprando
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {cartItems.map((item) => {
                    const price = item.producto?.precio_descuento || item.producto?.precio || 0;
                    const principalFoto = item.producto?.fotos?.find(f => f.es_principal)?.url || item.producto?.fotos?.[0]?.url;

                    return (
                      <div key={item.id} className="flex gap-4 border-b border-white/5 pb-4">
                        <div className="w-16 h-20 bg-neutral-900 overflow-hidden relative shrink-0">
                          {principalFoto ? (
                            <img src={principalFoto} alt={item.producto?.nombre} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-[10px] text-white/40">NO FOTO</div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-sm leading-tight text-white">{item.producto?.nombre}</h4>
                            <p className="text-[10px] text-white/40 uppercase mt-1">
                              Talla: {item.talla} | Color: {item.color}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-white/10 rounded-full px-2 py-0.5 text-xs">
                              <button
                                onClick={() => handleUpdateCantidad(item.id, item.cantidad - 1)}
                                className="px-2 hover:text-neon-green"
                              >
                                -
                              </button>
                              <span className="px-2 font-mono">{item.cantidad}</span>
                              <button
                                onClick={() => handleUpdateCantidad(item.id, item.cantidad + 1)}
                                className="px-2 hover:text-neon-green"
                              >
                                +
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs">${price.toLocaleString('es-CO')}</span>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-white/40 hover:text-hot-pink transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/10 pt-4 mt-4 space-y-4">
                  <div className="flex justify-between items-end font-mono">
                    <span className="text-white/40 text-xs uppercase">Subtotal</span>
                    <span className="text-xl text-white font-bold">${total.toLocaleString('es-CO')}</span>
                  </div>

                  <button
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full bg-white text-black font-anton tracking-widest text-sm py-4 uppercase hover:bg-neon-green hover:text-black transition-colors text-center block"
                  >
                    FINALIZAR PEDIDO
                  </button>
                </div>
              </>
            )}
          </motion.div>

          {/* Checkout Modal */}
          {isCheckoutOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-black border border-white/20 p-6 md:p-8 max-w-md w-full text-white font-space relative"
              >
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="absolute top-4 right-4 hover:text-neon-green"
                >
                  <X size={20} />
                </button>

                <h3 className="font-anton text-2xl uppercase tracking-wider mb-2">DATOS DE ENVÍO</h3>
                <p className="text-xs text-white/60 mb-6 uppercase">Ingresa los detalles para despachar tu ropa deportiva de Travesía.</p>

                <form onSubmit={handleFinalizarPedido} className="space-y-4 text-left">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest">Ciudad</label>
                    <input
                      type="text"
                      required
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder="Ej. Sogamoso"
                      className="bg-transparent border border-white/20 p-3 text-xs focus:border-neon-green outline-none transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest">Dirección de Envío</label>
                    <input
                      type="text"
                      required
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ej. Calle 11 # 12-34 Apto 301"
                      className="bg-transparent border border-white/20 p-3 text-xs focus:border-neon-green outline-none transition-colors"
                    />
                  </div>

                  <div className="bg-white/5 p-4 border border-white/10 space-y-2 mt-6">
                    <div className="flex justify-between text-xs font-mono">
                      <span>Total de Productos:</span>
                      <span>{cartItems.length}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold font-mono">
                      <span>Total:</span>
                      <span className="text-neon-green">${total.toLocaleString('es-CO')}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-neon-green text-black font-anton tracking-widest text-sm py-4 uppercase hover:brightness-110 transition-all text-center"
                  >
                    {loading ? 'PROCESANDO...' : 'ENVIAR PEDIDO POR WHATSAPP'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
