'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PlanesClient from './PlanesClient';

interface PlanFromDb {
  nombre: string;
  descripcion: string | null;
  precio: number;
  clases_incluidas: number;
}

export default function PlanesSection() {
  const [planes, setPlanes] = useState<PlanFromDb[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadPlanes = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('planes')
        .select('nombre, descripcion, precio, clases_incluidas')
        .eq('activo', true)
        .order('precio', { ascending: true });

      if (error) {
        console.error('No se pudieron cargar los planes:', error.message);
        setPlanes([]);
      } else {
        setPlanes(data || []);
      }
      setLoaded(true);
    };

    loadPlanes();
  }, []);

  if (!loaded || planes.length === 0) return null;

  return <PlanesClient planes={planes} />;
}
