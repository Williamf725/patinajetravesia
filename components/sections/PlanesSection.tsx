import { createServerClient } from '@/lib/supabase/server';
import PlanesClient from './PlanesClient';

export default async function PlanesSection() {
  const supabase = await createServerClient();

  const { data: planes } = await supabase
    .from('planes')
    .select('nombre, descripcion, precio, clases_incluidas')
    .eq('activo', true)
    .order('precio', { ascending: true });

  // Si no hay planes cargados o es nulo, se oculta la sección completamente por requerimiento
  if (!planes || planes.length === 0) {
    return null;
  }

  return <PlanesClient planes={planes} />;
}
