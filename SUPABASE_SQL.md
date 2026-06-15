# Configuración de Tablas Supabase - Club de Patinaje Travesía

Ejecuta este código en el editor SQL de Supabase para crear las tablas necesarias para el seguimiento de inicios de sesión.

## 1. Tabla de Logs de Inicio de Sesión

Esta tabla guardará el historial de cada vez que un usuario inicia sesión en la plataforma.

```sql
-- Crear la tabla de logs
CREATE TABLE IF NOT EXISTS public.login_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Política: Solo el usuario dueño del log puede verlo
CREATE POLICY "Users can view their own login logs"
ON public.login_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Política: El sistema puede insertar logs (Service Role o Authenticated users durante el proceso)
-- Nota: La inserción se hace desde Server Actions.
CREATE POLICY "Enable insert for authenticated users"
ON public.login_logs
FOR INSERT
WITH CHECK (true);
```

## 2. Índices para Optimización

```sql
-- Índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON public.login_logs(user_id);

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON public.login_logs(email);
```
