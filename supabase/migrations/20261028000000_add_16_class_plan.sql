-- Plan mensual de 16 clases para Club de Patinaje Travesía.
UPDATE public.planes
SET nombre = 'Mensualidad Intensiva',
    descripcion = '16 clases al mes',
    precio = 120000,
    activo = true
WHERE nombre = 'Mensualidad Intensiva' OR clases_incluidas = 16;

INSERT INTO public.planes (nombre, descripcion, precio, clases_incluidas, activo)
SELECT 'Mensualidad Intensiva', '16 clases al mes', 120000, 16, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.planes
  WHERE nombre = 'Mensualidad Intensiva' OR clases_incluidas = 16
);
