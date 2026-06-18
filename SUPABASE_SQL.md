# Configuración de Tablas Supabase - Club de Patinaje Travesía

Ejecuta este código en el editor SQL de Supabase para crear las tablas necesarias.

## 1. Tablas Base

```sql
-- Tabla de Alumnos
CREATE TABLE IF NOT EXISTS public.alumnos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_alumno INTEGER UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    email TEXT UNIQUE, -- Email para vincular con auth.users
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
('Mensualidad Completa', 70000, 8)
ON CONFLICT DO NOTHING;

-- Tabla de Inscripciones (Planes seleccionados por alumnos)
CREATE TABLE IF NOT EXISTS public.inscripciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.planes(id),
    mes TEXT NOT NULL,
    anio INTEGER NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    fecha_confirmacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(alumno_id, mes, anio)
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

## 2. RLS y Políticas

```sql
-- Habilitar RLS
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas para el Admin (Email específico)
-- En una app real, usaríamos roles o perfiles, pero aquí validamos por el email conocido.

CREATE POLICY "Admin full access on alumnos" ON public.alumnos FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');
CREATE POLICY "Admin full access on asistencia" ON public.asistencia FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');
CREATE POLICY "Admin full access on pagos" ON public.pagos FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');
CREATE POLICY "Admin full access on galeria" ON public.galeria FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');
CREATE POLICY "Admin full access on login_logs" ON public.login_logs FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');
CREATE POLICY "Admin full access on planes" ON public.planes FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');
CREATE POLICY "Admin full access on inscripciones" ON public.inscripciones FOR ALL USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');

-- Políticas para Alumnos (Portal)
CREATE POLICY "Alumnos can read their own data" ON public.alumnos FOR SELECT USING (auth.jwt() ->> 'email' = email);
CREATE POLICY "Alumnos can read all attendance" ON public.asistencia FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Alumnos can read attendance detail" ON public.alumnos FOR SELECT USING (auth.role() = 'authenticated'); -- Necesario para nombres
CREATE POLICY "Alumnos can read planes" ON public.planes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Alumnos can select their plan" ON public.inscripciones FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.alumnos
        WHERE id = alumno_id AND email = auth.jwt() ->> 'email'
    )
);
CREATE POLICY "Alumnos can read their own inscripciones" ON public.inscripciones FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.alumnos
        WHERE id = alumno_id AND email = auth.jwt() ->> 'email'
    )
);

-- Permitir lectura pública de galería para el TvSection
CREATE POLICY "Public read access on galeria" ON public.galeria FOR SELECT USING (true);
```

## 3. Índices

```sql
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha ON public.asistencia(fecha);
CREATE INDEX IF NOT EXISTS idx_pagos_mes_anio ON public.pagos(mes, anio);
CREATE INDEX IF NOT EXISTS idx_galeria_tipo ON public.galeria(tipo);
```
