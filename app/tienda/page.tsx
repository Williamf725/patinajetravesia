import React from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { Categoria, Producto } from '@/types/database';
import TiendaClient from '@/components/tienda/TiendaClient';

export const dynamic = 'force-dynamic';
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

  // 3. Get only categories with at least one available product
  interface CategoriaConProductos {
    id: string;
    nombre: string;
    slug: string;
    created_at?: string;
    productos?: { id: string }[];
  }

  let categoriasData: CategoriaConProductos[] | null = null;
  let catError: unknown = null;

  try {
    const res = await supabase
      .from('categorias')
      .select(`
        id, nombre, slug,
        productos!inner(id)
      `)
      .eq('activa', true)
      .eq('productos.disponible', true)
      .order('orden', { ascending: true });

    categoriasData = res.data as CategoriaConProductos[] | null;
    catError = res.error;
  } catch (err) {
    catError = err;
  }

  // Fallback if 'activa' or 'orden' do not exist in the database schema
  if (catError || !categoriasData) {
    const fallback = await supabase
      .from('categorias')
      .select(`
        id, nombre, slug,
        productos!inner(id)
      `)
      .eq('productos.disponible', true);

    categoriasData = fallback.data as CategoriaConProductos[] | null;
    if (categoriasData) {
      // Sort by name if 'orden' is not available
      categoriasData.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
  }

  // Deduplicate categories if the query returned nested duplicates
  const uniqueCategoriasMap = new Map<string, Categoria>();
  if (categoriasData) {
    categoriasData.forEach((cat: CategoriaConProductos) => {
      uniqueCategoriasMap.set(cat.id, {
        id: cat.id,
        nombre: cat.nombre,
        slug: cat.slug,
        created_at: cat.created_at || ''
      });
    });
  }
  const categorias = Array.from(uniqueCategoriasMap.values());

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
