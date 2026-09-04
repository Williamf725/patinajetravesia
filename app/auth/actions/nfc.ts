'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'clubdepatinajetravesia@gmail.com'

export async function registrarAsistenciaNFC({
  nfcUid,
  diaClase,
  fechaClase,
}: {
  nfcUid: string
  diaClase: string
  fechaClase: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { tipo: 'error' as const, mensaje: 'No autorizado' }
  }

  // Buscar alumno por NFC UID
  const { data: alumno } = await supabase
    .from('alumnos')
    .select('id, nombre_completo, numero_alumno')
    .eq('nfc_uid', nfcUid)
    .single()

  // Guardar log del escaneo
  await supabase.from('nfc_logs').insert({
    nfc_uid: nfcUid,
    alumno_id: alumno?.id || null,
    fecha: fechaClase,
    dia_clase: diaClase,
    registrado: !!alumno,
    motivo_fallo: alumno ? null : 'NFC no vinculado a ningún alumno',
  })

  if (!alumno) {
    return {
      tipo: 'error' as const,
      mensaje: 'Esta etiqueta NFC no está vinculada a ningún alumno. Ve al panel admin para vincularla.'
    }
  }

  const horario = diaClase === 'miercoles' ? '2:30pm-4:30pm'
    : diaClase === 'jueves' ? '6:30pm-8:30pm' : '4:00pm-6:00pm'

  // Verificar si ya tiene asistencia hoy
  const { data: yaExiste } = await supabase
    .from('asistencia')
    .select('id')
    .eq('alumno_id', alumno.id)
    .eq('fecha', fechaClase)
    .maybeSingle()

  if (yaExiste) {
    return {
      tipo: 'yaRegistrado' as const,
      nombre: alumno.nombre_completo,
      mensaje: 'Ya tenía asistencia registrada para esta fecha.',
    }
  }

  // Registrar asistencia
  const { error } = await supabase.from('asistencia').insert({
    alumno_id: alumno.id,
    fecha: fechaClase,
    dia_clase: diaClase,
    horario,
    presente: true,
  })

  if (error) {
    return { tipo: 'error' as const, mensaje: 'Error al registrar: ' + error.message }
  }

  revalidatePath('/dashboard')

  return {
    tipo: 'exito' as const,
    nombre: alumno.nombre_completo,
    mensaje: `Asistencia registrada correctamente — ${diaClase} (${horario}) ${fechaClase}`,
  }
}

export async function vincularNFC({
  alumnoId,
  nfcUid,
}: {
  alumnoId: string
  nfcUid: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { exito: false, mensaje: '❌ No autorizado' }
  }

  // Verificar que el NFC no esté ya vinculado a otro alumno
  const { data: existente } = await supabase
    .from('alumnos')
    .select('id, nombre_completo')
    .eq('nfc_uid', nfcUid)
    .maybeSingle()

  if (existente && existente.id !== alumnoId) {
    return {
      exito: false,
      mensaje: `❌ Esta etiqueta ya está vinculada a ${existente.nombre_completo}`
    }
  }

  const { error } = await supabase
    .from('alumnos')
    .update({ nfc_uid: nfcUid })
    .eq('id', alumnoId)

  if (error) return { exito: false, mensaje: '❌ Error: ' + error.message }

  revalidatePath('/dashboard')

  return { exito: true, mensaje: '✅ Etiqueta NFC vinculada correctamente' }
}

export async function desvincularNFC({
  alumnoId,
}: {
  alumnoId: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { exito: false, mensaje: '❌ No autorizado' }
  }

  const { error } = await supabase
    .from('alumnos')
    .update({ nfc_uid: null })
    .eq('id', alumnoId)

  if (error) return { exito: false, mensaje: '❌ Error al desvincular: ' + error.message }

  revalidatePath('/dashboard')

  return { exito: true, mensaje: '✅ Etiqueta NFC desvinculada correctamente' }
}
