import React from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { Categoria, Producto } from '@/types/database';
import TiendaClient from '@/components/tienda/TiendaClient';

export const revalidate = 0; // Disable static cache for dynamic cart & user checks

export default async function TiendaPage() {
  const supabase = await createServerClient();

  // 1. Get current authenticated user safely
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Get Alumno details if logged in
  let alumnoName = '';
  if (user) {
    const { data: alumno } = await supabase
      .from('alumnos')
      .select('nombre_completo')
      .eq('email', user.email)
      .single();

    if (alumno) {
      alumnoName = alumno.nombre_completo;
    }
  }

  // 3. Get all categories
  const { data: categoriasData } = await supabase
    .from('categorias')
    .select('*')
    .order('nombre', { ascending: true });

  const categorias = (categoriasData || []) as Categoria[];

  // 4. Get all available products with photos, tallas, and colors
  const { data: productosData } = await supabase
    .from('productos')
    .select(`
      *,
      categoria:categorias(nombre, slug),
      fotos:producto_fotos(url, alt, orden, es_principal),
      tallas:producto_tallas(talla, stock, disponible),
      colores:producto_colores(nombre, hex, disponible)
    `)
    .eq('disponible', true)
    .order('orden', { ascending: true });

  const productos = (productosData || []) as Producto[];

  return (
    <TiendaClient
      initialUser={user}
      alumnoName={alumnoName}
      categorias={categorias}
      productos={productos}
    />
  );
}
