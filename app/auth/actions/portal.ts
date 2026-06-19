'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { enviarConfirmacionPlan, enviarNotificacionAdmin, enviarPlanPorAcabar } from '@/lib/email/resend'

export async function getAlumnoByEmail(email: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('alumnos')
    .select('*')
    .eq('email', email)
    .single()

  if (error) return null
  return data
}

export async function selectPlan(alumnoId: string, planId: string) {
  const supabase = await createClient()

  const now = new Date()
  const mes = now.toLocaleString('es-ES', { month: 'long' }).toLowerCase()
  const anio = now.getFullYear()

  // 1. Get Plan and Alumno details for email
  const { data: plan } = await supabase.from('planes').select('*').eq('id', planId).single()
  const { data: alumno } = await supabase.from('alumnos').select('*').eq('id', alumnoId).single()

  if (!plan || !alumno) throw new Error('Información no encontrada')

  // 2. Create Inscripcion
  // Omitimos numero_alumno — se asume que Supabase maneja ID
  const { error } = await supabase.from('inscripciones').insert({
    alumno_id: alumnoId,
    plan_id: planId,
    mes,
    anio,
    estado: 'pendiente'
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya tienes un plan seleccionado para este mes.')
    }
    throw error
  }

  // 3. Create Notification record
  await supabase.from('notificaciones').insert({
    alumno_id: alumnoId,
    tipo: 'plan_escogido',
    metadata: { plan_nombre: plan.nombre, mes, anio }
  })

  // 4. Send Emails
  try {
    await enviarConfirmacionPlan(alumno.nombre_completo, alumno.email!, plan.nombre, plan.precio)
    await enviarNotificacionAdmin(alumno.nombre_completo, alumno.email!, plan.nombre)
  } catch (e) {
    console.error('Email error:', e)
  }

  revalidatePath('/portal')
}

export async function getPlanes() {
  const supabase = await createClient()
  const { data } = await supabase.from('planes').select('*').order('precio', { ascending: true })
  return data || []
}

export async function getInscripcionActual(alumnoId: string) {
  const supabase = await createClient()
  const now = new Date()
  const mes = now.toLocaleString('es-ES', { month: 'long' }).toLowerCase()
  const anio = now.getFullYear()

  const { data: inscripcion } = await supabase
    .from('inscripciones')
    .select('*, plan:planes(*)')
    .eq('alumno_id', alumnoId)
    .eq('mes', mes)
    .eq('anio', anio)
    .single()

  if (!inscripcion) return null

  // Calculate classes used
  const startOfMonth = new Date(anio, now.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(anio, now.getMonth() + 1, 0).toISOString().split('T')[0]

  const { count } = await supabase
    .from('asistencia')
    .select('*', { count: 'exact', head: true })
    .eq('alumno_id', alumnoId)
    .eq('presente', true)
    .gte('fecha', startOfMonth)
    .lte('fecha', endOfMonth)

  const clasesUsadas = count || 0
  const clasesRestantes = Math.max(0, (inscripcion.plan?.clases_incluidas || 0) - clasesUsadas)

  // Requirement: If exactly 1 class left, notify
  if (clasesRestantes === 1 && inscripcion.estado === 'aprobado') {
     // Check if notification already sent for this month
     const { data: existingNotif } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('alumno_id', alumnoId)
        .eq('tipo', 'plan_por_acabar')
        .eq('metadata->>mes', mes)
        .eq('metadata->>anio', anio.toString())
        .single()

     if (!existingNotif) {
        // Send notification
        const { data: alumno } = await supabase.from('alumnos').select('*').eq('id', alumnoId).single()
        if (alumno) {
          try {
            await enviarPlanPorAcabar(alumno.nombre_completo, alumno.email!, 1)
            await supabase.from('notificaciones').insert({
              alumno_id: alumnoId,
              tipo: 'plan_por_acabar',
              metadata: { mes, anio: anio.toString() }
            })
          } catch (e) {
            console.error('Notification error:', e)
          }
        }
     }
  }

  return {
    ...inscripcion,
    clases_usadas: clasesUsadas
  }
}

export async function getHistorialInscripciones(alumnoId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('inscripciones')
    .select('*, plan:planes(*)')
    .eq('alumno_id', alumnoId)
    .order('created_at', { ascending: false })

  return data || []
}
