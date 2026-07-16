# Configuración de Tablas Supabase - Club de Patinaje Travesía

Ejecuta este código en el editor SQL de Supabase para crear las tablas necesarias.

## 1. Tablas Base

```sql
-- Tabla de Alumnos
CREATE TABLE IF NOT EXISTS public.alumnos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_alumno SERIAL UNIQUE NOT NULL,
    nombre TEXT,
    apellido TEXT,
    nombre_completo TEXT NOT NULL,
    email TEXT UNIQUE,
    tipo_documento TEXT, -- CC, TI, Pasaporte, NIT
    numero_documento TEXT,
    telefono TEXT,
    fecha_nacimiento DATE,
    perfil_completo BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    inscripcion_pagada BOOLEAN DEFAULT false,
    fecha_pago_inscripcion DATE,
    fecha_vencimiento_seguro DATE,
    observaciones TEXT,
    comprobante_inscripcion_url TEXT,
    comprobante_inscripcion_pendiente BOOLEAN DEFAULT false,
    tipo_pago_inscripcion TEXT CHECK (tipo_pago_inscripcion IN ('solo_inscripcion', 'inscripcion_y_plan')),
    plan_inscripcion_id UUID REFERENCES public.planes(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Planes
CREATE TABLE IF NOT EXISTS public.planes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    precio NUMERIC NOT NULL,
    clases_incluidas INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar planes iniciales
INSERT INTO public.planes (nombre, precio, clases_incluidas) VALUES
('Clase Individual', 12000, 1),
('Mensualidad Básica', 40000, 4),
('Mensualidad Completa', 70000, 8),
('Mensualidad Premium', 100000, 12)
ON CONFLICT DO NOTHING;

-- Tabla de Inscripciones (Planes seleccionados por alumnos)
CREATE TABLE IF NOT EXISTS public.inscripciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.planes(id),
    mes TEXT NOT NULL,
    anio INTEGER NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    clases_usadas INTEGER DEFAULT 0,
    total_pagado NUMERIC DEFAULT 0,
    observaciones TEXT,
    comprobante_url TEXT,
    comprobante_verificado BOOLEAN DEFAULT false,
    fecha_vencimiento TIMESTAMPTZ,
    fecha_aprobacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(alumno_id, mes, anio)
);

-- Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- 'plan_escogido', 'plan_por_acabar', etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Asistencia
CREATE TABLE IF NOT EXISTS public.asistencia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    presente BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(alumno_id, fecha)
);

-- Tabla de Pagos
CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    mes TEXT NOT NULL,
    anio INTEGER NOT NULL,
    clases_tomadas INTEGER DEFAULT 0,
    valor_por_clase NUMERIC DEFAULT 0,
    pago_mensual NUMERIC DEFAULT 0,
    pagado BOOLEAN DEFAULT false,
    abonos JSONB DEFAULT '[]'::jsonb, -- Array de objetos: { monto: number, fecha: string }
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(alumno_id, mes, anio)
);

-- Tabla de Galería
CREATE TABLE IF NOT EXISTS public.galeria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    public_id TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('foto', 'video')),
    titulo TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Logs de Inicio de Sesión
CREATE TABLE IF NOT EXISTS public.login_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## 2. Automatización (Triggers)

```sql
-- Función para sincronizar clases usadas automáticamente
CREATE OR REPLACE FUNCTION public.sync_clases_usadas()
RETURNS TRIGGER AS $$
DECLARE
    v_mes TEXT;
    v_anio INTEGER;
    v_count INTEGER;
BEGIN
    -- Determinar mes y año de la asistencia (en español y minúsculas para coincidir con la app)
    v_mes := trim(lower(to_char(NEW.fecha, 'TMmonth')));
    v_anio := CAST(to_char(NEW.fecha, 'YYYY') AS INTEGER);

    -- Contar asistencias del alumno en ese mes/año
    SELECT count(*) INTO v_count
    FROM public.asistencia
    WHERE alumno_id = NEW.alumno_id
      AND presente = true
      AND trim(lower(to_char(fecha, 'TMmonth'))) = v_mes
      AND CAST(to_char(fecha, 'YYYY') AS INTEGER) = v_anio;

    -- Actualizar la inscripción correspondiente
    UPDATE public.inscripciones
    SET clases_usadas = v_count,
        updated_at = now()
    WHERE alumno_id = NEW.alumno_id
      AND lower(mes) = v_mes
      AND anio = v_anio;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para asistencia
DROP TRIGGER IF EXISTS tr_sync_asistencia ON public.asistencia;
CREATE TRIGGER tr_sync_asistencia
AFTER INSERT OR UPDATE ON public.asistencia
FOR EACH ROW EXECUTE FUNCTION public.sync_clases_usadas();
```

## 3. RLS y Políticas

```sql
-- Habilitar RLS
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- 1. Políticas de Administrador (Acceso total)
-- Validamos por el email conocido del administrador.

CREATE POLICY "Admin full access on alumnos" ON public.alumnos FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');
CREATE POLICY "Admin full access on asistencia" ON public.asistencia FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');
CREATE POLICY "Admin full access on pagos" ON public.pagos FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');
CREATE POLICY "Admin full access on galeria" ON public.galeria FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');
CREATE POLICY "Admin full access on login_logs" ON public.login_logs FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');
CREATE POLICY "Admin full access on planes" ON public.planes FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');
CREATE POLICY "Admin full access on inscripciones" ON public.inscripciones FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');
CREATE POLICY "Admin full access on notificaciones" ON public.notificaciones FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');

-- 2. Políticas para Alumnos (Portal)

-- Alumnos pueden leer su propio perfil
CREATE POLICY "Alumnos can read their own data" ON public.alumnos FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Alumnos pueden leer su propia asistencia
CREATE POLICY "Alumnos can read their own attendance" ON public.asistencia FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.alumnos
        WHERE id = alumno_id AND email = auth.jwt() ->> 'email'
    )
);

-- Alumnos pueden leer todos los planes disponibles
CREATE POLICY "Alumnos can read planes" ON public.planes FOR SELECT USING (auth.role() = 'authenticated');

-- Alumnos pueden crear sus propias inscripciones
CREATE POLICY "Alumnos can select their plan" ON public.inscripciones FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.alumnos
        WHERE id = alumno_id AND email = auth.jwt() ->> 'email'
    )
);

-- Alumnos pueden leer y actualizar sus propias inscripciones (ej. subir comprobante)
CREATE POLICY "Alumnos can read/update their own inscripciones" ON public.inscripciones FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.alumnos
        WHERE id = alumno_id AND email = auth.jwt() ->> 'email'
    )
);

-- 3. Otras Políticas

-- Permitir lectura pública de galería para el TvSection
CREATE POLICY "Public read access on galeria" ON public.galeria FOR SELECT USING (true);

-- Alumnos pueden ver sus propias notificaciones
CREATE POLICY "Alumnos can read their notifications" ON public.notificaciones FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.alumnos
        WHERE id = alumno_id AND email = auth.jwt() ->> 'email'
    )
);
```

## 4. Índices

```sql
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha ON public.asistencia(fecha);
CREATE INDEX IF NOT EXISTS idx_pagos_mes_anio ON public.pagos(mes, anio);
CREATE INDEX IF NOT EXISTS idx_galeria_tipo ON public.galeria(tipo);

-- ## 5. Integración del Seguro y Comprobante de Inscripción (Seguro Mundial)

-- Ejecuta esto si estás actualizando un entorno existente
ALTER TABLE public.alumnos
ADD COLUMN IF NOT EXISTS inscripcion_pagada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_pago_inscripcion DATE,
ADD COLUMN IF NOT EXISTS fecha_vencimiento_seguro DATE,
ADD COLUMN IF NOT EXISTS observaciones TEXT,
ADD COLUMN IF NOT EXISTS comprobante_inscripcion_url TEXT,
ADD COLUMN IF NOT EXISTS comprobante_inscripcion_pendiente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tipo_pago_inscripcion TEXT CHECK (tipo_pago_inscripcion IN ('solo_inscripcion', 'inscripcion_y_plan')),
ADD COLUMN IF NOT EXISTS plan_inscripcion_id UUID REFERENCES public.planes(id);
```
