'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePerfil(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autorizado')

  const nombre = formData.get('nombre') as string
  const apellido = formData.get('apellido') as string
  const tipo_documento = formData.get('tipo_documento') as string
  const numero_documento = formData.get('numero_documento') as string
  const telefono = formData.get('telefono') as string

  const perfil_completo = !!(tipo_documento && numero_documento && telefono)

  const { error } = await supabase
    .from('alumnos')
    .update({
      nombre,
      apellido,
      nombre_completo: `${nombre} ${apellido}`,
      tipo_documento,
      numero_documento,
      telefono,
      perfil_completo
    })
    .eq('email', user.email)

  if (error) throw error

  revalidatePath('/portal')
  return { success: true }
}
