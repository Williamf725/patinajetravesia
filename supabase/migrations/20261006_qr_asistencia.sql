-- ============================================================
-- Sistema de Asistencia QR - Club de Patinaje Travesía
-- Ejecutar TODO este archivo en el editor SQL de Supabase
-- (mismo lugar donde se ejecutó el SQL original del proyecto).
-- No modifica ninguna tabla, trigger ni política existente:
-- solo AGREGA la tabla asistencia_qr y dos funciones RPC.
--
-- Reglas del sistema:
--  * CUALQUIER día puede ser día de clase (no hay días fijos).
--  * Los escaneos llegan a asistencia_qr (registro provisional).
--  * La clase se CONFIRMA cuando llegan 4+ registros distintos
--    dentro de máximo 2 horas desde el primer registro del día.
--  * Al confirmarse, todos los registros del día pasan a la tabla
--    asistencia (presente = true) y el trigger existente
--    tr_sync_asistencia actualiza clases_usadas solo.
--  * Registros posteriores dentro de la ventana de 2 horas también
--    cuentan en cuanto la clase ya está confirmada.
--  * Si en 2 horas no llegan a 4, la clase NO queda registrada:
--    los registros provisionales no pasan a asistencia.
-- ============================================================

-- 1. Tabla provisional de registros QR del día
CREATE TABLE IF NOT EXISTS public.asistencia_qr (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL, -- fecha en zona horaria de Bogotá
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(alumno_id, fecha)
);

ALTER TABLE public.asistencia_qr ENABLE ROW LEVEL SECURITY;

-- Solo el admin lee la tabla directamente (para la pestaña QR).
-- El público nunca accede directo: entra solo por las funciones RPC.
CREATE POLICY "Admin full access on asistencia_qr" ON public.asistencia_qr FOR ALL
  USING (auth.jwt() ->> 'email' = 'clubdepatinajetravesia@gmail.com');

CREATE INDEX IF NOT EXISTS idx_asistencia_qr_fecha ON public.asistencia_qr(fecha);

-- 2. Función pública: lista de alumnos activos para el selector
--    de nombres de la página QR. SECURITY DEFINER permite leer
--    la tabla alumnos sin abrir políticas RLS de lectura pública.
CREATE OR REPLACE FUNCTION public.obtener_alumnos_qr()
RETURNS TABLE (id UUID, nombre_completo TEXT, numero_alumno INTEGER)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.nombre_completo, a.numero_alumno
  FROM public.alumnos a
  WHERE a.activo = true
  ORDER BY a.numero_alumno ASC;
$$;

-- 3. Función pública: registra un escaneo QR con toda la validación
--    del lado del servidor (zona horaria America/Bogota).
CREATE OR REPLACE FUNCTION public.registrar_asistencia_qr(p_alumno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ahora   TIMESTAMP := now() AT TIME ZONE 'America/Bogota';
  v_hoy     DATE      := v_ahora::date;
  v_alumno  public.alumnos%ROWTYPE;
  v_primera TIMESTAMPTZ;
  v_count   INT;
  v_minimo  CONSTANT INT := 4;              -- mínimo de personas para confirmar clase
  v_ventana CONSTANT INTERVAL := '2 hours'; -- ventana máx. desde el primer registro
BEGIN
  -- Validación 1: el alumno existe y está activo
  SELECT * INTO v_alumno
  FROM public.alumnos
  WHERE id = p_alumno_id AND activo = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Alumno no encontrado o inactivo.',
      'fecha', v_hoy
    );
  END IF;

  -- Validación 2: no duplicar el registro del día (por QR)
  IF EXISTS (SELECT 1 FROM public.asistencia_qr
             WHERE alumno_id = p_alumno_id AND fecha = v_hoy) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Tu asistencia de hoy ya estaba registrada.',
      'fecha', v_hoy,
      'nombre', v_alumno.nombre_completo
    );
  END IF;

  -- Validación 3: el admin ya lo marcó hoy en la planilla
  IF EXISTS (SELECT 1 FROM public.asistencia
             WHERE alumno_id = p_alumno_id AND fecha = v_hoy) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Tu asistencia de hoy ya está registrada.',
      'fecha', v_hoy,
      'nombre', v_alumno.nombre_completo
    );
  END IF;

  -- Estado actual de la ventana del día (primer registro y total)
  SELECT MIN(created_at), COUNT(*)
    INTO v_primera, v_count
  FROM public.asistencia_qr
  WHERE fecha = v_hoy;

  -- Validación 4: la ventana de registro dura máximo 2 horas
  -- desde el primer registro del día
  IF v_count > 0 AND v_primera + v_ventana < now() THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'El registro de asistencia de hoy ya cerró (pasaron más de 2 horas desde que empezó).',
      'fecha', v_hoy
    );
  END IF;

  -- Registrar el escaneo en la tabla provisional
  INSERT INTO public.asistencia_qr (alumno_id, fecha)
  VALUES (p_alumno_id, v_hoy);

  v_count := v_count + 1;

  -- Si con este registro se llega al mínimo, la clase queda
  -- CONFIRMADA: todos los del día pasan a asistencia oficial.
  -- A partir de ese momento, quien llegue dentro de la ventana
  -- también se propaga de inmediato (v_count >= v_minimo).
  IF v_count >= v_minimo THEN
    INSERT INTO public.asistencia (alumno_id, fecha, presente)
    SELECT alumno_id, fecha, true
    FROM public.asistencia_qr
    WHERE fecha = v_hoy
    ON CONFLICT (alumno_id, fecha) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'nombre', v_alumno.nombre_completo,
    'fecha', v_hoy,
    'registrados_hoy', v_count,
    'clase_confirmada', v_count >= v_minimo,
    'mensaje', CASE
      WHEN v_count >= v_minimo
        THEN 'Asistencia registrada. ¡La clase quedó confirmada!'
      ELSE 'Asistencia registrada. La clase se confirmará cuando se registren mínimo '
           || v_minimo || ' personas (máximo 2 horas desde el inicio).'
    END
  );
END;
$$;

-- 4. Permisos: la página QR es pública (rol anon) y también usable
--    con sesión iniciada (rol authenticated).
GRANT EXECUTE ON FUNCTION public.obtener_alumnos_qr() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_asistencia_qr(UUID) TO anon, authenticated;
