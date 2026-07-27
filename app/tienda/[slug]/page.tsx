import React from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProductoDetailClient from '@/components/tienda/ProductoDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Dynamic check for user/cart sync

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductoPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createServerClient();

  // 1. Get authenticated user safely
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Fetch student profile if exists
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

  // 3. Fetch product by slug with category, fotos, tallas, and colores
  const { data: producto } = await supabase
    .from('productos')
    .select(`
      *,
      categoria:categorias(nombre, slug),
      fotos:producto_fotos(url, alt, orden, es_principal),
      tallas:producto_tallas(talla, stock, disponible),
      colores:producto_colores(nombre, hex, disponible)
    `)
    .eq('slug', slug)
    .eq('disponible', true)
    .single();

  if (!producto) {
    return notFound();
  }

  return (
    <ProductoDetailClient
      producto={producto}
      initialUser={user}
      alumnoName={alumnoName}
    />
  );
}
