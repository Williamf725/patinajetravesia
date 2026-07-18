'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { enviarPlanAprobado, enviarPlanRechazado } from '@/lib/email/resend'

const ADMIN_EMAIL = 'clubdepatinajetravesia@gmail.com'

async function checkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== ADMIN_EMAIL) {
    throw new Error('Unauthorized')
  }
}

export async function savePagosChanges(pagos: {
  alumno_id: string;
  plan_id: string;
  mes: string;
  anio: number;
  clases_usadas: number;
  total_pagado: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  observaciones: string | null;
}[]) {
  await checkAdmin()
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('inscripciones')
    .upsert(pagos, { onConflict: 'alumno_id, mes, anio' })

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function verifyComprobante(id: string) {
  await checkAdmin()
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('inscripciones')
    .update({ comprobante_verificado: true })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function updateInscripcionEstado(id: string, estado: 'aprobado' | 'rechazado' | 'pendiente') {
  await checkAdmin()
  const supabase = await createServerClient()

  const { data: inscripcion } = await supabase
    .from('inscripciones')
    .select('*, alumno:alumnos(*), plan:planes(*)')
    .eq('id', id)
    .single()

  if (!inscripcion) throw new Error('Inscripción no encontrada')

  const { error } = await supabase
    .from('inscripciones')
    .update({
      estado,
      fecha_aprobacion: estado === 'aprobado' ? new Date().toISOString() : null
    })
    .eq('id', id)

  if (error) throw error

  // Send Email on approval
  if (estado === 'aprobado' && inscripcion.alumno) {
    try {
      await enviarPlanAprobado(
        inscripcion.alumno.nombre_completo,
        inscripcion.alumno.email!,
        inscripcion.plan?.nombre || 'Plan',
        inscripcion.plan?.clases_incluidas || 0
      )
    } catch (e) {
      console.error('Email error:', e)
    }
  } else if (estado === 'rechazado' && inscripcion.alumno) {
    try {
      await enviarPlanRechazado(inscripcion.alumno.nombre_completo, inscripcion.alumno.email!)
    } catch (e) {
      console.error('Email error:', e)
    }
  }

  revalidatePath('/dashboard')
}

export async function updateClasesUsadas(id: string, clases_usadas: number) {
  await checkAdmin()
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('inscripciones')
    .update({ clases_usadas })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function getInscripciones() {
  await checkAdmin()
  const supabase = await createServerClient()

  const { data } = await supabase
    .from('inscripciones')
    .select('*, alumno:alumnos(*), plan:planes(*)')
    .order('estado', { ascending: false }) // 'pendiente' first if we order correctly, but better to sort in client
    .order('created_at', { ascending: false })

  return data || []
}

export interface ExportInscripcion {
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  clases_usadas: number;
  total_pagado: number;
  created_at: string;
  fecha_vencimiento: string | null;
  anio: number;
  mes: string;
  plan: {
    nombre: string;
    precio: number;
    clases_incluidas: number;
  } | null;
}

export interface AlumnoWithInscripciones {
  id: string;
  numero_alumno: number;
  nombre: string | null;
  apellido: string | null;
  nombre_completo: string;
  email: string | null;
  tipo_documento: string | null;
  numero_documento: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  perfil_completo: boolean;
  activo: boolean;
  created_at: string;
  inscripcion_pagada?: boolean;
  fecha_pago_inscripcion?: string | null;
  fecha_vencimiento_seguro?: string | null;
  observaciones?: string | null;
  comprobante_inscripcion_url?: string | null;
  comprobante_inscripcion_pendiente?: boolean;
  tipo_pago_inscripcion?: 'solo_inscripcion' | 'inscripcion_y_plan' | null;
  plan_inscripcion_id?: string | null;
  inscripciones?: ExportInscripcion[];
}

export async function obtenerDatosExport(): Promise<AlumnoWithInscripciones[]> {
  await checkAdmin()
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('alumnos')
    .select(`
      *,
      inscripciones(
        estado,
        clases_usadas,
        total_pagado,
        created_at,
        fecha_vencimiento,
        anio,
        mes,
        plan:planes(nombre, precio, clases_incluidas)
      )
    `)
    .order('numero_alumno', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as AlumnoWithInscripciones[]
}
