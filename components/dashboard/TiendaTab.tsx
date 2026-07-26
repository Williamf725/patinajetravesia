'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Categoria, Producto, ProductoFoto, Pedido } from '@/types/database';
import { getSignaturaProducto } from '@/app/auth/actions/cloudinary';
import { crearProducto, guardarFotoProducto } from '@/app/auth/actions/admin';
import { toast } from 'sonner';
import { ShoppingBag, CreditCard, Plus, Edit2, Trash2, Image as ImageIcon, Layers, Palette, Eye, ArrowLeft, ArrowRight, Star, Check } from 'lucide-react';

type SubTab = 'productos' | 'pedidos';

export default function TiendaTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('productos');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter for Pedidos
  const [filtroPedidoEstado, setFiltroPedidoEstado] = useState<string>('todos');

  // Modal control states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);

  // Separate spec management modals
  const [managingPhotosProduct, setManagingPhotosProduct] = useState<Producto | null>(null);
  const [managingTallasProduct, setManagingTallasProduct] = useState<Producto | null>(null);
  const [managingColoresProduct, setManagingColoresProduct] = useState<Producto | null>(null);
  const [expandedPedidoId, setExpandedPedidoId] = useState<string | null>(null);

  // Form states for Product Modal
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [descripcionCorta, setDescripcionCorta] = useState('');
  const [descripcionCompleta, setDescripcionCompleta] = useState('');
  const [precio, setPrecio] = useState<number>(0);
  const [precioDescuento, setPrecioDescuento] = useState<number | undefined>(undefined);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState('');
  const [genero, setGenero] = useState<'Hombre' | 'Mujer' | 'Unisex'>('Unisex');
  const [disponible, setDisponible] = useState(true);
  const [destacado, setDestacado] = useState(false);

  // Tallas form states
  const [tallaStock, setTallaStock] = useState<Record<string, { stock: number; disponible: boolean }>>({
    'XS': { stock: 0, disponible: true },
    'S': { stock: 0, disponible: true },
    'M': { stock: 0, disponible: true },
    'L': { stock: 0, disponible: true },
    'XL': { stock: 0, disponible: true },
    'XXL': { stock: 0, disponible: true }
  });
  const [nuevaTallaPersonalizada, setNuevaTallaPersonalizada] = useState('');

  // Colores form states
  const [nuevoColorHex, setNuevoColorHex] = useState('#000000');
  const [nuevoColorNombre, setNuevoColorNombre] = useState('');

  const supabase = createClient();

  // Load basic configurations
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: catData } = await supabase.from('categorias').select('*').order('nombre');
      setCategorias((catData || []) as Categoria[]);

      // Fetch products
      const { data: prodData } = await supabase
        .from('productos')
        .select(`
          *,
          categoria:categorias(*),
          fotos:producto_fotos(*),
          tallas:producto_tallas(*),
          colores:producto_colores(*)
        `)
        .order('orden', { ascending: true });

      setProductos((prodData || []) as Producto[]);

      // Fetch orders
      const { data: pedData } = await supabase
        .from('pedidos')
        .select(`
          *,
          items:pedido_items(
            *,
            producto:productos(*)
          )
        `)
        .order('created_at', { ascending: false });

      setPedidos((pedData || []) as Pedido[]);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar datos de la tienda');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate slug automatically from product name
  const handleNombreChange = (val: string) => {
    setNombre(val);
    if (!editingProduct) {
      const generatedSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  // Open modal for new product
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setNombre('');
    setSlug('');
    setDescripcionCorta('');
    setDescripcionCompleta('');
    setPrecio(0);
    setPrecioDescuento(undefined);
    setSelectedCategoriaId(categorias[0]?.id || '');
    setGenero('Unisex');
    setDisponible(true);
    setDestacado(false);
    setIsProductModalOpen(true);
  };

  // Open modal to edit product
  const handleOpenEditProduct = (p: Producto) => {
    setEditingProduct(p);
    setNombre(p.nombre);
    setSlug(p.slug);
    setDescripcionCorta(p.descripcion || '');
    setDescripcionCompleta(p.descripcion || '');
    setPrecio(p.precio);
    setPrecioDescuento(p.precio_descuento || undefined);
    setSelectedCategoriaId(p.categoria_id || '');

    // Fallback gender matching keywords
    const descLower = `${p.nombre} ${p.descripcion || ''}`.toLowerCase();
    if (descLower.includes('hombre')) setGenero('Hombre');
    else if (descLower.includes('mujer')) setGenero('Mujer');
    else setGenero('Unisex');

    setDisponible(p.disponible);
    setDestacado(p.nuevo); // map destacado to nuevo
    setIsProductModalOpen(true);
  };

  // Save Product (insert/update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !precio) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      if (editingProduct) {
        const payload = {
          nombre,
          slug,
          descripcion_corta: descripcionCorta || null,
          descripcion: descripcionCompleta || null,
          precio,
          precio_descuento: precioDescuento || null,
          categoria_id: selectedCategoriaId || null,
          disponible,
          nuevo: destacado,
          genero: genero.toLowerCase()
        };
        const { error } = await supabase
          .from('productos')
          .update(payload)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Producto actualizado con éxito');
        setIsProductModalOpen(false);
        loadData();
      } else {
        // Use server action for creation as requested
        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('descripcionCorta', descripcionCorta);
        formData.append('descripcion', descripcionCompleta);
        formData.append('precio', precio.toString());
        formData.append('precioDescuento', precioDescuento ? precioDescuento.toString() : '');
        formData.append('categoriaId', selectedCategoriaId);
        formData.append('genero', genero.toLowerCase());
        formData.append('disponible', disponible.toString());
        formData.append('destacado', destacado.toString());

        const resultado = await crearProducto(formData);
        if (resultado.error) {
          toast.error(resultado.error);
        } else {
          setIsProductModalOpen(false);
          toast.success('✅ Producto creado correctamente');
          loadData();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el producto');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, prodNombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${prodNombre}"?`)) return;
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Producto eliminado con éxito');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar el producto');
    }
  };

  // Toggle inline product availability
  const handleToggleDisponible = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('productos')
        .update({ disponible: !current })
        .eq('id', id);

      if (error) throw error;
      toast.success('Estado actualizado inline');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar disponibilidad');
    }
  };

  // Upload Photo directly to Cloudinary folder products/[slug] and save to DB via Server Action
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !managingPhotosProduct) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { signature, timestamp, apiKey, cloudName, folder } = await getSignaturaProducto(managingPhotosProduct.slug);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', folder);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          { method: 'POST', body: formData }
        );

        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || 'Error uploading file');

        // Insert via Server Action guardarFotoProducto
        const saveResult = await guardarFotoProducto(managingPhotosProduct.id, result.secure_url, file.name);
        if (saveResult.error) {
          throw new Error(saveResult.error);
        }
      } catch (err) {
        console.error(err);
        toast.error(`Error al subir ${file.name}`);
      }
    }

    toast.success('Fotos subidas con éxito');
    // Refresh modal info
    const { data: updatedProd } = await supabase
      .from('productos')
      .select('*, fotos:producto_fotos(*)')
      .eq('id', managingPhotosProduct.id)
      .single();

    if (updatedProd) {
      setManagingPhotosProduct(updatedProd as Producto);
    }
    loadData();
  };

  // Delete product photo
  const handleDeletePhoto = async (photoId: string, productoId: string) => {
    try {
      const { error } = await supabase.from('producto_fotos').delete().eq('id', photoId);
      if (error) throw error;
      toast.success('Foto eliminada');

      const { data: updatedProd } = await supabase
        .from('productos')
        .select('*, fotos:producto_fotos(*)')
        .eq('id', productoId)
        .single();

      if (updatedProd) {
        setManagingPhotosProduct(updatedProd as Producto);
      }
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar foto');
    }
  };

  // Set principal photo (star)
  const handleSetPrincipalPhoto = async (photoId: string, productoId: string) => {
    try {
      // Set all other photos of product to false
      await supabase
        .from('producto_fotos')
        .update({ es_principal: false })
        .eq('producto_id', productoId);

      // Set selected photo to true
      const { error } = await supabase
        .from('producto_fotos')
        .update({ es_principal: true })
        .eq('id', photoId);

      if (error) throw error;
      toast.success('Foto principal seleccionada');

      const { data: updatedProd } = await supabase
        .from('productos')
        .select('*, fotos:producto_fotos(*)')
        .eq('id', productoId)
        .single();

      if (updatedProd) {
        setManagingPhotosProduct(updatedProd as Producto);
      }
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al seleccionar principal');
    }
  };

  // Reorder photos with ← →
  const handleReorderPhoto = async (photo: ProductoFoto, direction: 'left' | 'right', index: number) => {
    if (!managingPhotosProduct || !managingPhotosProduct.fotos) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= managingPhotosProduct.fotos.length) return;

    const targetPhoto = managingPhotosProduct.fotos[targetIndex];

    try {
      // Swap order
      await supabase.from('producto_fotos').update({ orden: targetPhoto.orden }).eq('id', photo.id);
      await supabase.from('producto_fotos').update({ orden: photo.orden }).eq('id', targetPhoto.id);

      const { data: updatedProd } = await supabase
        .from('productos')
        .select('*, fotos:producto_fotos(*)')
        .eq('id', managingPhotosProduct.id)
        .single();

      if (updatedProd) {
        setManagingPhotosProduct(updatedProd as Producto);
      }
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al reordenar');
    }
  };

  // Open tallas modal and load stock details
  const handleOpenTallasModal = (p: Producto) => {
    setManagingTallasProduct(p);

    // Clear initial state
    const initialTallas: Record<string, { stock: number; disponible: boolean }> = {
      'XS': { stock: 0, disponible: true },
      'S': { stock: 0, disponible: true },
      'M': { stock: 0, disponible: true },
      'L': { stock: 0, disponible: true },
      'XL': { stock: 0, disponible: true },
      'XXL': { stock: 0, disponible: true }
    };

    // Populate actual DB records
    p.tallas?.forEach(t => {
      initialTallas[t.talla] = { stock: t.stock, disponible: t.disponible };
    });

    setTallaStock(initialTallas);
    setNuevaTallaPersonalizada('');
  };

  // Save tallas configurations
  const handleSaveTallas = async () => {
    if (!managingTallasProduct) return;

    try {
      // Delete old records
      await supabase.from('producto_tallas').delete().eq('producto_id', managingTallasProduct.id);

      // Insert new records
      const insertData = Object.entries(tallaStock).map(([talla, detail]) => ({
        producto_id: managingTallasProduct.id,
        talla,
        stock: detail.stock,
        disponible: detail.disponible
      }));

      const { error } = await supabase.from('producto_tallas').insert(insertData);
      if (error) throw error;

      toast.success('Configuración de tallas guardada');
      setManagingTallasProduct(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar tallas');
    }
  };

  // Add custom size
  const handleAddTallaPersonalizada = () => {
    const size = nuevaTallaPersonalizada.toUpperCase().trim();
    if (!size) return;
    setTallaStock(prev => ({
      ...prev,
      [size]: { stock: 0, disponible: true }
    }));
    setNuevaTallaPersonalizada('');
  };

  // Add Color Configuration
  const handleAddColor = async () => {
    if (!managingColoresProduct || !nuevoColorNombre) {
      toast.error('Escribe el nombre del color');
      return;
    }

    try {
      const { error } = await supabase
        .from('producto_colores')
        .insert({
          producto_id: managingColoresProduct.id,
          nombre: nuevoColorNombre,
          hex: nuevoColorHex,
          disponible: true
        });

      if (error) throw error;
      toast.success('Color agregado');
      setNuevoColorNombre('');

      // Refresh list
      const { data: updatedProd } = await supabase
        .from('productos')
        .select('*, colores:producto_colores(*)')
        .eq('id', managingColoresProduct.id)
        .single();

      if (updatedProd) {
        setManagingColoresProduct(updatedProd as Producto);
      }
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al agregar color');
    }
  };

  // Delete Color
  const handleDeleteColor = async (colorId: string) => {
    if (!managingColoresProduct) return;
    try {
      const { error } = await supabase.from('producto_colores').delete().eq('id', colorId);
      if (error) throw error;
      toast.success('Color eliminado');

      // Refresh list
      const { data: updatedProd } = await supabase
        .from('productos')
        .select('*, colores:producto_colores(*)')
        .eq('id', managingColoresProduct.id)
        .single();

      if (updatedProd) {
        setManagingColoresProduct(updatedProd as Producto);
      }
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar color');
    }
  };

  // Toggle color available checkbox
  const handleToggleColorDisponible = async (colorId: string, current: boolean) => {
    if (!managingColoresProduct) return;
    try {
      const { error } = await supabase
        .from('producto_colores')
        .update({ disponible: !current })
        .eq('id', colorId);

      if (error) throw error;
      toast.success('Estado del color actualizado');

      // Refresh list
      const { data: updatedProd } = await supabase
        .from('productos')
        .select('*, colores:producto_colores(*)')
        .eq('id', managingColoresProduct.id)
        .single();

      if (updatedProd) {
        setManagingColoresProduct(updatedProd as Producto);
      }
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar color');
    }
  };

  // Update order delivery pipelines (pendiente, confirmado, enviado, entregado)
  const handleUpdatePedidoEstado = async (pedidoId: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', pedidoId);

      if (error) throw error;
      toast.success(`Pedido actualizado a: ${nuevoEstado.toUpperCase()}`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar estado del pedido');
    }
  };

  const getPedidoStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'confirmado': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'enviado': return 'bg-neon-orange/10 text-neon-orange border border-neon-orange/20';
      case 'entregado': return 'bg-neon-green/10 text-neon-green border border-neon-green/20';
      default: return 'bg-white/10 text-white/60 border border-white/25';
    }
  };

  // Filtering orders
  const filteredPedidos = pedidos.filter(p => {
    if (filtroPedidoEstado === 'todos') return true;
    return p.estado === filtroPedidoEstado;
  });

  return (
    <div className="space-y-8 font-mono text-xs uppercase text-white">
      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveSubTab('productos')}
          className={`flex items-center gap-2 px-4 py-2 font-anton text-lg tracking-wider border-b-2 transition-all ${
            activeSubTab === 'productos' ? 'border-neon-green text-neon-green' : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <ShoppingBag size={18} /> PRODUCTOS
        </button>
        <button
          onClick={() => setActiveSubTab('pedidos')}
          className={`flex items-center gap-2 px-4 py-2 font-anton text-lg tracking-wider border-b-2 transition-all ${
            activeSubTab === 'pedidos' ? 'border-neon-green text-neon-green' : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <CreditCard size={18} /> PEDIDOS
        </button>
      </div>

      {loading ? (
        <div className="p-20 text-center animate-pulse tracking-widest">CARGANDO MÓDULO TIENDA...</div>
      ) : activeSubTab === 'productos' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="font-anton text-2xl tracking-wider text-neon-green">GESTIÓN DE CATÁLOGO</h3>
            <button
              onClick={handleOpenNewProduct}
              className="btn-tape flex items-center gap-2 py-3 px-6 text-xs"
            >
              <Plus size={14} /> NUEVO PRODUCTO
            </button>
          </div>

          {/* Table Container scrolleable mobile */}
          <div className="tabla-admin bg-[#111] border border-white/10">
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="bg-black text-[10px] text-white/40 border-b border-white/10 uppercase tracking-wider">
                  <th className="p-4 text-center">FOTO</th>
                  <th className="p-4">NOMBRE</th>
                  <th className="p-4">PRECIO</th>
                  <th className="p-4">CATEGORÍA</th>
                  <th className="p-4 text-center">DISPONIBLE</th>
                  <th className="p-4 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-white/20">NO SE ENCONTRARON PRODUCTOS</td>
                  </tr>
                ) : (
                  productos.map((p) => {
                    const principalFoto = p.fotos?.find(f => f.es_principal)?.url || p.fotos?.[0]?.url;
                    return (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 flex justify-center">
                          <div className="w-12 h-16 bg-black/40 border border-white/10 overflow-hidden relative shrink-0">
                            {principalFoto ? (
                              <img src={principalFoto} alt={p.nombre} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-white/20">NO FOTO</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-white normal-case">
                          <span className="block font-anton text-base uppercase tracking-tight leading-tight">{p.nombre}</span>
                          <span className="block text-[8px] font-mono uppercase text-white/40 tracking-wider">SLUG: {p.slug}</span>
                        </td>
                        <td className="p-4 font-mono">
                          {p.precio_descuento ? (
                            <div className="flex flex-col">
                              <span className="text-white/40 line-through text-[10px]">${p.precio.toLocaleString()}</span>
                              <span className="text-neon-green font-bold">${p.precio_descuento.toLocaleString()}</span>
                            </div>
                          ) : (
                            <span>${p.precio.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="p-4 text-white/60">{p.categoria?.nombre || '-'}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleDisponible(p.id, p.disponible)}
                            className={`px-3 py-1 font-bold text-[10px] border tracking-widest ${
                              p.disponible
                                ? 'bg-neon-green/10 text-neon-green border-neon-green/20'
                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}
                          >
                            {p.disponible ? 'ACTIVO' : 'INACTIVO'}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-2 border border-white/10 hover:border-white text-white/60 hover:text-white"
                              title="Editar Detalles"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => setManagingPhotosProduct(p)}
                              className="p-2 border border-white/10 hover:border-white text-white/60 hover:text-white"
                              title="Gestionar Fotos"
                            >
                              <ImageIcon size={12} />
                            </button>
                            <button
                              onClick={() => handleOpenTallasModal(p)}
                              className="p-2 border border-white/10 hover:border-white text-white/60 hover:text-white"
                              title="Gestionar Tallas"
                            >
                              <Layers size={12} />
                            </button>
                            <button
                              onClick={() => setManagingColoresProduct(p)}
                              className="p-2 border border-white/10 hover:border-white text-white/60 hover:text-white"
                              title="Gestionar Colores"
                            >
                              <Palette size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.nombre)}
                              className="p-2 border border-red-500/20 hover:border-red-500 text-red-500/60 hover:text-red-500"
                              title="Eliminar"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Orders sub-tab */
        <div className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="font-anton text-2xl tracking-wider text-neon-green">PEDIDOS DE TRAVESÍA</h3>

            {/* Status filters */}
            <div className="flex gap-2 bg-[#111] p-1 border border-white/10">
              {['todos', 'pendiente', 'confirmado', 'enviado', 'entregado'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFiltroPedidoEstado(status)}
                  className={`px-3 py-1.5 text-[10px] uppercase font-bold transition-all ${
                    filtroPedidoEstado === status ? 'bg-white text-black font-anton' : 'text-white/40 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="tabla-admin bg-[#111] border border-white/10">
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="bg-black text-[10px] text-white/40 border-b border-white/10 uppercase tracking-wider">
                  <th className="p-4">PEDIDO ID</th>
                  <th className="p-4">CLIENTE</th>
                  <th className="p-4">CIUDAD / DIRECCIÓN</th>
                  <th className="p-4">TOTAL</th>
                  <th className="p-4 text-center">ESTADO</th>
                  <th className="p-4 text-center">DETALLES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPedidos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-white/20">NO HAY PEDIDOS REGISTRADOS</td>
                  </tr>
                ) : (
                  filteredPedidos.map((ped) => {
                    const isExpanded = expandedPedidoId === ped.id;
                    const dateStr = new Date(ped.created_at).toLocaleDateString('es-CO');

                    return (
                      <React.Fragment key={ped.id}>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono text-white/40 text-[9px] font-bold">
                            #{ped.id.substring(0, 8).toUpperCase()}
                            <span className="block text-[8px] font-mono text-white/20 mt-1">{dateStr}</span>
                          </td>
                          <td className="p-4 font-bold text-white normal-case">
                            <span className="block uppercase">{ped.nombre_alumno || 'Cliente'}</span>
                          </td>
                          <td className="p-4 text-white/60 normal-case">
                            <span className="block uppercase text-[10px] font-bold text-white">{ped.ciudad}</span>
                            <span className="block text-[9px] uppercase text-white/40 mt-0.5">{ped.direccion}</span>
                          </td>
                          <td className="p-4 font-mono font-bold text-neon-green">${ped.total.toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <select
                              value={ped.estado}
                              onChange={(e) => handleUpdatePedidoEstado(ped.id, e.target.value)}
                              className={`px-3 py-1.5 font-bold text-[10px] uppercase font-mono tracking-widest outline-none border cursor-pointer ${getPedidoStatusBadgeClass(ped.estado)} bg-black`}
                            >
                              <option value="pendiente">PENDIENTE</option>
                              <option value="confirmado">CONFIRMADO</option>
                              <option value="enviado">ENVIADO</option>
                              <option value="entregado">ENTREGADO</option>
                            </select>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setExpandedPedidoId(isExpanded ? null : ped.id)}
                              className="p-2 border border-white/10 hover:border-white text-white/60 hover:text-white"
                            >
                              <Eye size={12} />
                            </button>
                          </td>
                        </tr>

                        {/* Collapsible item list */}
                        {isExpanded && (
                          <tr className="bg-black/40">
                            <td colSpan={6} className="p-6">
                              <div className="space-y-4 text-left">
                                <h4 className="font-anton text-neon-green text-sm tracking-wider">PRODUCTOS DEL PEDIDO</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {ped.items?.map((item) => (
                                    <div key={item.id} className="border border-white/10 p-4 flex gap-4 bg-black/60 font-mono text-[10px]">
                                      <div className="w-10 h-14 bg-neutral-900 overflow-hidden relative shrink-0">
                                        {item.producto?.fotos?.[0]?.url ? (
                                          <img src={item.producto.fotos[0].url} alt={item.producto.nombre} className="object-cover w-full h-full" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[8px] text-white/20">NO FOTO</div>
                                        )}
                                      </div>

                                      <div className="flex-1 flex flex-col justify-between uppercase">
                                        <div>
                                          <h5 className="font-bold text-white leading-tight">{item.producto?.nombre || 'Producto'}</h5>
                                          <p className="text-[8px] text-white/40 mt-1">
                                            Talla: {item.talla} | Color: {item.color}
                                          </p>
                                        </div>
                                        <div className="flex justify-between items-end mt-2 font-mono">
                                          <span className="text-white/40">Cantidad: {item.cantidad}</span>
                                          <span className="font-bold text-white">${item.precio.toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* product save details modal */}
      {isProductModalOpen && (
        <div
          onClick={() => setIsProductModalOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          {/* Contenido del modal — detiene propagación del click */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111',
              border: '2px solid #333',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              margin: 'auto',
            }}
          >
            {/* Botón X para cerrar */}
            <button
              onClick={() => setIsProductModalOpen(false)}
              style={{
                position: 'sticky', top: 0, float: 'right',
                background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#fff', width: '32px', height: '32px',
                borderRadius: '50%', cursor: 'pointer', fontSize: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10
              }}
            >
              ✕
            </button>

            <h3 className="font-anton text-2xl uppercase tracking-wider mb-6 text-neon-green">
              {editingProduct ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 clear-both">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-white/40 uppercase">Nombre del Producto</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => handleNombreChange(e.target.value)}
                    placeholder="Ej. Sudadera Oversized"
                    className="bg-transparent border border-white/20 p-3 text-xs text-white focus:border-neon-green outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-white/40 uppercase">Slug</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="ej-sudadera-oversized"
                    className="bg-transparent border border-white/20 p-3 text-xs text-white focus:border-neon-green outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase">Descripción Corta (Max 150 caracteres)</label>
                <textarea
                  maxLength={150}
                  value={descripcionCorta}
                  onChange={(e) => setDescripcionCorta(e.target.value)}
                  placeholder="Pequeño resumen del producto..."
                  className="bg-transparent border border-white/20 p-3 text-xs text-white focus:border-neon-green outline-none h-16 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase">Descripción Completa</label>
                <textarea
                  value={descripcionCompleta}
                  onChange={(e) => setDescripcionCompleta(e.target.value)}
                  placeholder="Detalles sobre materiales, horma, costuras..."
                  className="bg-transparent border border-white/20 p-3 text-xs text-white focus:border-neon-green outline-none h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-white/40 uppercase">Precio COP</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={precio}
                    onChange={(e) => setPrecio(Number(e.target.value))}
                    placeholder="80000"
                    className="bg-transparent border border-white/20 p-3 text-xs text-white focus:border-neon-green outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-white/40 uppercase">Precio con Descuento COP (Opcional)</label>
                  <input
                    type="number"
                    min="0"
                    value={precioDescuento || ''}
                    onChange={(e) => setPrecioDescuento(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="65000"
                    className="bg-transparent border border-white/20 p-3 text-xs text-white focus:border-neon-green outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-white/40 uppercase">Categoría</label>
                  <select
                    value={selectedCategoriaId}
                    onChange={(e) => setSelectedCategoriaId(e.target.value)}
                    className="bg-black border border-white/20 p-3 text-xs text-white focus:border-neon-green outline-none cursor-pointer"
                  >
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-white/40 uppercase">Género</label>
                  <select
                    value={genero}
                    onChange={(e) => setGenero(e.target.value as 'Hombre' | 'Mujer' | 'Unisex')}
                    className="bg-black border border-white/20 p-3 text-xs text-white focus:border-neon-green outline-none cursor-pointer"
                  >
                    <option value="Unisex">UNISEX</option>
                    <option value="Hombre">HOMBRE</option>
                    <option value="Mujer">MUJER</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-8 pt-4 border-t border-white/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disponible}
                    onChange={(e) => setDisponible(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 accent-neon-green"
                  />
                  <span className="text-[10px] uppercase">Disponible para Venta</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={destacado}
                    onChange={(e) => setDestacado(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 accent-neon-green"
                  />
                  <span className="text-[10px] uppercase">Marcar como Nuevo / Destacado</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-neon-green text-black font-anton tracking-widest text-sm py-4 uppercase hover:brightness-110 transition-all mt-6"
              >
                {editingProduct ? 'GUARDAR CAMBIOS' : 'CREAR PRODUCTO'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* photo manager modal — exact same style with internal scroll, centered, blurred backdrop */}
      {managingPhotosProduct && (
        <div
          onClick={() => setManagingPhotosProduct(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          {/* Contenido del modal — detiene propagación del click */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111',
              border: '2px solid #333',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              margin: 'auto',
            }}
          >
            {/* Botón X para cerrar */}
            <button
              onClick={() => setManagingPhotosProduct(null)}
              style={{
                position: 'sticky', top: 0, float: 'right',
                background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#fff', width: '32px', height: '32px',
                borderRadius: '50%', cursor: 'pointer', fontSize: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10
              }}
            >
              ✕
            </button>

            <h3 className="font-anton text-2xl uppercase tracking-wider mb-2 text-neon-green">GESTIONAR FOTOS</h3>
            <p className="text-[10px] text-white/40 uppercase mb-6">Subir y reordenar fotos de: {managingPhotosProduct.nombre}</p>

            <div className="space-y-6 clear-both">
              {/* Drag and drop style Area */}
              <div className="border-2 border-dashed border-white/20 p-8 text-center relative hover:border-white/40 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <p className="font-mono text-xs text-white/60">ARRASTRA TUS FOTOS AQUÍ O HAZ CLIC PARA SELECCIONAR</p>
                <p className="text-[8px] text-white/40 mt-1">Formatos: JPG, PNG, WEBP — Máximo 10MB por foto</p>
              </div>

              {/* Photos grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {managingPhotosProduct.fotos && managingPhotosProduct.fotos.length > 0 ? (
                  [...managingPhotosProduct.fotos]
                    .sort((a, b) => a.orden - b.orden)
                    .map((foto, index, arr) => (
                      <div key={foto.id} className="border border-white/10 p-2 space-y-2 relative bg-black/40">
                        <div className="aspect-[3/4] bg-neutral-900 overflow-hidden relative">
                          <img src={foto.url} alt={foto.alt || 'Producto'} className="object-cover w-full h-full" />
                          {foto.es_principal && (
                            <span className="absolute top-2 left-2 bg-neon-green text-black p-1 rounded-full" title="Foto principal">
                              <Star size={10} fill="currentColor" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[8px] text-white/60 font-bold uppercase tracking-wider">
                          <div className="flex gap-1">
                            <button
                              disabled={index === 0}
                              onClick={() => handleReorderPhoto(foto, 'left', index)}
                              className="p-1 border border-white/10 hover:border-white disabled:opacity-30 disabled:pointer-events-none"
                            >
                              <ArrowLeft size={8} />
                            </button>
                            <button
                              disabled={index === arr.length - 1}
                              onClick={() => handleReorderPhoto(foto, 'right', index)}
                              className="p-1 border border-white/10 hover:border-white disabled:opacity-30 disabled:pointer-events-none"
                            >
                              <ArrowRight size={8} />
                            </button>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleSetPrincipalPhoto(foto.id, managingPhotosProduct.id)}
                              className="p-1 border border-white/10 hover:border-white"
                              title="Marcar principal"
                            >
                              <Check size={8} />
                            </button>
                            <button
                              onClick={() => handleDeletePhoto(foto.id, managingPhotosProduct.id)}
                              className="p-1 border border-red-500/20 hover:border-red-500 text-red-500"
                              title="Eliminar"
                            >
                              <Trash2 size={8} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="col-span-full py-10 text-center text-white/20">NO SE ENCONTRARON FOTOS</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* tallas manager modal — exact same style with internal scroll, centered, blurred backdrop */}
      {managingTallasProduct && (
        <div
          onClick={() => setManagingTallasProduct(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          {/* Contenido del modal — detiene propagación del click */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111',
              border: '2px solid #333',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              margin: 'auto',
            }}
          >
            {/* Botón X para cerrar */}
            <button
              onClick={() => setManagingTallasProduct(null)}
              style={{
                position: 'sticky', top: 0, float: 'right',
                background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#fff', width: '32px', height: '32px',
                borderRadius: '50%', cursor: 'pointer', fontSize: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10
              }}
            >
              ✕
            </button>

            <h3 className="font-anton text-2xl uppercase tracking-wider mb-2 text-neon-green">GESTIONAR TALLAS</h3>
            <p className="text-[10px] text-white/40 uppercase mb-6">Configurar disponibilidad y stock de: {managingTallasProduct.nombre}</p>

            <div className="space-y-6 clear-both">
              {/* Predefined Tallas list */}
              <div className="space-y-4">
                {Object.entries(tallaStock).map(([talla, detail]) => (
                  <div key={talla} className="flex items-center justify-between gap-4 p-3 bg-white/5 border border-white/10 font-bold uppercase tracking-wider text-[10px]">
                    <span className="font-anton text-base w-12">{talla}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white/40">Stock:</span>
                        <input
                          type="number"
                          min="0"
                          value={detail.stock}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTallaStock(prev => ({
                              ...prev,
                              [talla]: { ...prev[talla], stock: val }
                            }));
                          }}
                          placeholder="Stock"
                          className="w-16 bg-black border border-white/20 p-1.5 text-center text-xs text-white"
                        />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={detail.disponible}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setTallaStock(prev => ({
                              ...prev,
                              [talla]: { ...prev[talla], disponible: val }
                            }));
                          }}
                          className="accent-neon-green"
                        />
                        <span>Disponible</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Talla */}
              <div className="flex gap-2 border-t border-white/10 pt-4">
                <input
                  type="text"
                  value={nuevaTallaPersonalizada}
                  onChange={(e) => setNuevaTallaPersonalizada(e.target.value)}
                  placeholder="Ej. XXXL"
                  className="flex-1 bg-transparent border border-white/20 p-3 text-xs text-white uppercase"
                />
                <button
                  type="button"
                  onClick={handleAddTallaPersonalizada}
                  className="bg-white text-black font-anton px-6 text-xs uppercase hover:bg-neon-green hover:text-black transition-colors"
                >
                  + AGREGAR TALLA
                </button>
              </div>

              <button
                onClick={handleSaveTallas}
                className="w-full bg-neon-green text-black font-anton tracking-widest text-sm py-4 uppercase hover:brightness-110 transition-all mt-6"
              >
                GUARDAR CONFIGURACIÓN DE TALLAS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* colores manager modal — exact same style with internal scroll, centered, blurred backdrop */}
      {managingColoresProduct && (
        <div
          onClick={() => setManagingColoresProduct(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          {/* Contenido del modal — detiene propagación del click */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111',
              border: '2px solid #333',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              margin: 'auto',
            }}
          >
            {/* Botón X para cerrar */}
            <button
              onClick={() => setManagingColoresProduct(null)}
              style={{
                position: 'sticky', top: 0, float: 'right',
                background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#fff', width: '32px', height: '32px',
                borderRadius: '50%', cursor: 'pointer', fontSize: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10
              }}
            >
              ✕
            </button>

            <h3 className="font-anton text-2xl uppercase tracking-wider mb-2 text-neon-green">GESTIONAR COLORES</h3>
            <p className="text-[10px] text-white/40 uppercase mb-6">Colores configurados para: {managingColoresProduct.nombre}</p>

            <div className="space-y-6 clear-both">
              {/* Color addition section */}
              <div className="bg-white/5 border border-white/10 p-4 space-y-4">
                <h4 className="font-anton text-sm tracking-wider">AÑADIR NUEVO COLOR</h4>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[8px] text-white/40">Paleta</span>
                    <input
                      type="color"
                      value={nuevoColorHex}
                      onChange={(e) => setNuevoColorHex(e.target.value)}
                      className="w-10 h-10 bg-transparent border-0 cursor-pointer outline-none"
                    />
                  </div>

                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[8px] text-white/40">Nombre del Color</span>
                    <input
                      type="text"
                      value={nuevoColorNombre}
                      onChange={(e) => setNuevoColorNombre(e.target.value)}
                      placeholder="Ej. Negro Mate"
                      className="bg-transparent border border-white/20 p-2.5 text-xs text-white"
                    />
                  </div>

                  <button
                    onClick={handleAddColor}
                    className="bg-white text-black font-anton px-6 py-3 self-end text-xs uppercase hover:bg-neon-green hover:text-black transition-colors"
                  >
                    + AGREGAR
                  </button>
                </div>
              </div>

              {/* Colors List */}
              <div className="space-y-2">
                <span className="text-[10px] text-white/40 uppercase tracking-widest block font-mono">Colores existentes</span>
                {managingColoresProduct.colores && managingColoresProduct.colores.length > 0 ? (
                  managingColoresProduct.colores.map((color) => (
                    <div key={color.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 font-bold uppercase tracking-wider text-[10px]">
                      <div className="flex items-center gap-3">
                        <div
                          style={{ backgroundColor: color.hex }}
                          className="w-6 h-6 rounded-full border border-white/20 shrink-0"
                        />
                        <span>{color.nombre} ({color.hex.toUpperCase()})</span>
                      </div>

                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={color.disponible}
                            onChange={() => handleToggleColorDisponible(color.id, color.disponible)}
                            className="accent-neon-green"
                          />
                          <span>Disponible</span>
                        </label>

                        <button
                          onClick={() => handleDeleteColor(color.id)}
                          className="text-red-500 hover:text-red-400 p-1"
                          title="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-white/20">NO SE ENCONTRARON COLORES</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
