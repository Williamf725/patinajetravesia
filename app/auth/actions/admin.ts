'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'clubdepatinajetravesia@gmail.com'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== ADMIN_EMAIL) {
    throw new Error('Unauthorized')
  }
}

export async function updateInscripcionEstado(id: string, estado: 'aprobado' | 'rechazado' | 'pendiente') {
  await checkAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('inscripciones')
    .update({
      estado,
      fecha_confirmacion: estado === 'aprobado' ? new Date().toISOString() : null
    })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function getInscripciones() {
  await checkAdmin()
  const supabase = await createClient()

  const { data } = await supabase
    .from('inscripciones')
    .select('*, alumno:alumnos(*), plan:planes(*)')
    .order('estado', { ascending: false }) // 'pendiente' first if we order correctly, but better to sort in client
    .order('created_at', { ascending: false })

  return data || []
}
