-- Asistencia QR pública: selección de nombre, fecha automática y clase válida con 4+ estudiantes.
-- Solo se exponen id, nombre y número de los alumnos activos; ningún dato privado.

ALTER TABLE public.asistencia_qr
  ADD COLUMN IF NOT EXISTS dia_clase TEXT;

UPDATE public.asistencia_qr
SET dia_clase = CASE extract(isodow from fecha)
  WHEN 1 THEN 'Lunes' WHEN 2 THEN 'Martes' WHEN 3 THEN 'Miércoles'
  WHEN 4 THEN 'Jueves' WHEN 5 THEN 'Viernes' WHEN 6 THEN 'Sábado'
  ELSE 'Domingo'
END
WHERE dia_clase IS NULL;

UPDATE public.asistencia
SET dia_clase = CASE extract(isodow from fecha)
  WHEN 1 THEN 'Lunes' WHEN 2 THEN 'Martes' WHEN 3 THEN 'Miércoles'
  WHEN 4 THEN 'Jueves' WHEN 5 THEN 'Viernes' WHEN 6 THEN 'Sábado'
  ELSE 'Domingo'
END
WHERE dia_clase IS NULL;

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

CREATE OR REPLACE FUNCTION public.registrar_asistencia_qr(p_alumno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hoy     DATE := (now() AT TIME ZONE 'America/Bogota')::date;
  v_dia     TEXT;
  v_alumno  public.alumnos%ROWTYPE;
  v_primera TIMESTAMPTZ;
  v_count   INT;
  v_minimo  CONSTANT INT := 4;
  v_ventana CONSTANT INTERVAL := '2 hours';
BEGIN
  v_dia := CASE extract(isodow from v_hoy)
    WHEN 1 THEN 'Lunes' WHEN 2 THEN 'Martes' WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves' WHEN 5 THEN 'Viernes' WHEN 6 THEN 'Sábado'
    ELSE 'Domingo'
  END;

  SELECT * INTO v_alumno
  FROM public.alumnos
  WHERE id = p_alumno_id AND activo = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Alumno no encontrado o inactivo.', 'fecha', v_hoy);
  END IF;

  -- Serializa los registros de una fecha para que el cuarto escaneo
  -- siempre confirme la clase, incluso si varias personas confirman a la vez.
  PERFORM pg_advisory_xact_lock(hashtext('asistencia_qr:' || v_hoy::text));

  IF EXISTS (SELECT 1 FROM public.asistencia_qr
             WHERE alumno_id = p_alumno_id AND fecha = v_hoy) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Tu asistencia de hoy ya estaba registrada.',
      'fecha', v_hoy,
      'nombre', v_alumno.nombre_completo
    );
  END IF;

  IF EXISTS (SELECT 1 FROM public.asistencia
             WHERE alumno_id = p_alumno_id AND fecha = v_hoy) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Tu asistencia de hoy ya está registrada.',
      'fecha', v_hoy,
      'nombre', v_alumno.nombre_completo
    );
  END IF;

  SELECT MIN(created_at), COUNT(*) INTO v_primera, v_count
  FROM public.asistencia_qr
  WHERE fecha = v_hoy;

  IF v_count > 0 AND v_primera + v_ventana < now() THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'El registro de asistencia de hoy ya cerró (pasaron más de 2 horas desde que empezó).',
      'fecha', v_hoy
    );
  END IF;

  INSERT INTO public.asistencia_qr (alumno_id, fecha, dia_clase)
  VALUES (p_alumno_id, v_hoy, v_dia);
  v_count := v_count + 1;

  IF v_count >= v_minimo THEN
    INSERT INTO public.asistencia (alumno_id, fecha, presente, dia_clase)
    SELECT q.alumno_id, q.fecha, true, q.dia_clase
    FROM public.asistencia_qr q
    WHERE q.fecha = v_hoy
    ON CONFLICT (alumno_id, fecha) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'nombre', v_alumno.nombre_completo,
    'fecha', v_hoy,
    'dia_clase', v_dia,
    'registrados_hoy', v_count,
    'clase_confirmada', v_count >= v_minimo,
    'mensaje', CASE
      WHEN v_count >= v_minimo THEN 'Asistencia registrada. ¡La clase quedó confirmada!'
      ELSE 'Asistencia registrada. La clase se confirmará cuando se registren mínimo ' || v_minimo || ' personas (máximo 2 horas desde el inicio).'
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_alumnos_qr() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_asistencia_qr(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_alumnos_qr() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_asistencia_qr(UUID) TO anon, authenticated;
