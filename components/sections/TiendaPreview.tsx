import React from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { TiendaPreviewHeader, TiendaPreviewButton } from './TiendaPreviewHeader';
import TiendaCarousel from './TiendaCarousel';

export default async function TiendaPreview() {
  const supabase = await createServerClient();

  // Cargar productos reales desde Supabase
  const { data: productos } = await supabase
    .from('productos')
    .select(`
      id, nombre, slug, descripcion_corta, precio,
      fotos:producto_fotos(url, alt, es_principal)
    `)
    .eq('disponible', true)
    .order('orden', { ascending: true });

  // Si la tabla de productos está vacía o no hay productos disponibles, ocultar la sección completa
  if (!productos || productos.length === 0) {
    return null;
  }

  return (
    <section id="tienda-preview" style={{ background: '#000', padding: '120px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        {/* Título y subtítulo con animación (Client wrapper) */}
        <TiendaPreviewHeader />

        {/* Nuevo carrusel infinito de productos con marquesina CSS y flechas interactivas */}
        <TiendaCarousel productos={productos} />

        <div style={{ marginTop: '48px' }}>
          {/* Botón "VER COLECCIÓN COMPLETA" con animación (Client wrapper) */}
          <TiendaPreviewButton />
        </div>
      </div>
    </section>
  );
}
