-- Refuerzo de autenticación, privacidad y permisos RPC.
DROP VIEW IF EXISTS public.alumno_actual;

ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.sync_clases_usadas() SET search_path = public;
ALTER FUNCTION public.actualizar_clases_usadas() SET search_path = public;
ALTER FUNCTION public.get_user_id_by_email(text) SET search_path = public;

-- Los triggers siguen funcionando, pero no son RPC invocables por clientes.
REVOKE ALL ON FUNCTION public.actualizar_clases_usadas() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.obtener_alumnos_qr()
RETURNS TABLE (id UUID, nombre_completo TEXT, numero_alumno INTEGER)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.nombre_completo, a.numero_alumno
  FROM public.alumnos a
  WHERE a.activo = true AND public.is_admin()
  ORDER BY a.numero_alumno ASC;
$$;

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
  v_minimo  CONSTANT INT := 4;
  v_ventana CONSTANT INTERVAL := '2 hours';
BEGIN
  -- El admin registra a cualquier alumno; un alumno solo se registra a sí mismo.
  IF NOT public.is_admin() AND (
    auth.uid() IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.alumnos
      WHERE id = p_alumno_id
        AND lower(email) = lower(auth.jwt() ->> 'email')
    )
  ) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Inicia sesión con tu cuenta para registrar tu asistencia.',
      'fecha', v_hoy
    );
  END IF;

  SELECT * INTO v_alumno
  FROM public.alumnos
  WHERE id = p_alumno_id AND activo = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Alumno no encontrado o inactivo.', 'fecha', v_hoy);
  END IF;

  IF EXISTS (SELECT 1 FROM public.asistencia_qr
             WHERE alumno_id = p_alumno_id AND fecha = v_hoy) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tu asistencia de hoy ya estaba registrada.', 'fecha', v_hoy, 'nombre', v_alumno.nombre_completo);
  END IF;

  IF EXISTS (SELECT 1 FROM public.asistencia
             WHERE alumno_id = p_alumno_id AND fecha = v_hoy) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tu asistencia de hoy ya está registrada.', 'fecha', v_hoy, 'nombre', v_alumno.nombre_completo);
  END IF;

  SELECT MIN(created_at), COUNT(*) INTO v_primera, v_count
  FROM public.asistencia_qr WHERE fecha = v_hoy;

  IF v_count > 0 AND v_primera + v_ventana < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'El registro de asistencia de hoy ya cerró (pasaron más de 2 horas desde que empezó).', 'fecha', v_hoy);
  END IF;

  INSERT INTO public.asistencia_qr (alumno_id, fecha) VALUES (p_alumno_id, v_hoy);
  v_count := v_count + 1;

  IF v_count >= v_minimo THEN
    INSERT INTO public.asistencia (alumno_id, fecha, presente)
    SELECT alumno_id, fecha, true FROM public.asistencia_qr
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
      WHEN v_count >= v_minimo THEN 'Asistencia registrada. ¡La clase quedó confirmada!'
      ELSE 'Asistencia registrada. La clase se confirmará cuando se registren mínimo ' || v_minimo || ' personas (máximo 2 horas desde el inicio).'
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_alumnos_qr() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.registrar_asistencia_qr(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_alumnos_qr() TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_asistencia_qr(UUID) TO authenticated;

