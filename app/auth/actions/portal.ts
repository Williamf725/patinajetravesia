'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  return {
    ...inscripcion,
    clases_usadas: count || 0
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
