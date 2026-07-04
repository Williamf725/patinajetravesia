'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function guardarPerfil(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const nombre = formData.get('nombre') as string
  const apellido = formData.get('apellido') as string
  const tipoDocumento = formData.get('tipoDocumento') as string
  const numeroDocumento = formData.get('numeroDocumento') as string
  const telefono = formData.get('telefono') as string
  const dia = formData.get('dia') as string
  const mes = formData.get('mes') as string
  const anio = formData.get('anioNacimiento') as string

  const fecha_nacimiento = (dia && mes && anio) ? `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}` : null

  console.log('Guardando perfil:', { email: user.email, tipoDocumento, numeroDocumento, telefono, fecha_nacimiento })

  const { error } = await supabase
    .from('alumnos')
    .update({
      nombre,
      apellido,
      nombre_completo: `${nombre} ${apellido}`,
      tipo_documento: tipoDocumento || null,
      numero_documento: numeroDocumento || null,
      telefono: telefono || null,
      fecha_nacimiento,
      perfil_completo: !!(tipoDocumento && numeroDocumento && telefono && fecha_nacimiento)
    })
    .eq('email', user.email)

  if (error) {
    console.error('Error guardando perfil:', error.code, error.message)
    return { error: `Error al guardar: ${error.message}` }
  }

  revalidatePath('/portal')
  return { success: true }
}

/** @deprecated Use guardarPerfil instead */
export const updatePerfil = guardarPerfil;
