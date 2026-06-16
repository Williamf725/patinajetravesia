# Configuración de Tablas Supabase - Club de Patinaje Travesía

Ejecuta este código en el editor SQL de Supabase para crear las tablas necesarias.

## 1. Tablas Base

```sql
-- Tabla de Alumnos
CREATE TABLE IF NOT EXISTS public.alumnos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_alumno INTEGER UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
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
    abonos JSONB DEFAULT '[]'::jsonb, -- Array de objetos: { monto: number, fecha: string }
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
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

CREATE POLICY "Admin full access on alumnos" ON public.alumnos FOR ALL USING (auth.jwt() ->> 'email' = 'patinajetravesia@gmail.com');
CREATE POLICY "Admin full access on asistencia" ON public.asistencia FOR ALL USING (auth.jwt() ->> 'email' = 'patinajetravesia@gmail.com');
CREATE POLICY "Admin full access on pagos" ON public.pagos FOR ALL USING (auth.jwt() ->> 'email' = 'patinajetravesia@gmail.com');
CREATE POLICY "Admin full access on galeria" ON public.galeria FOR ALL USING (auth.jwt() ->> 'email' = 'patinajetravesia@gmail.com');
CREATE POLICY "Admin full access on login_logs" ON public.login_logs FOR ALL USING (auth.jwt() ->> 'email' = 'patinajetravesia@gmail.com');

-- Permitir lectura pública de galería para el TvSection
CREATE POLICY "Public read access on galeria" ON public.galeria FOR SELECT USING (true);
```

## 3. Índices

```sql
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha ON public.asistencia(fecha);
CREATE INDEX IF NOT EXISTS idx_pagos_mes_anio ON public.pagos(mes, anio);
CREATE INDEX IF NOT EXISTS idx_galeria_tipo ON public.galeria(tipo);
```
