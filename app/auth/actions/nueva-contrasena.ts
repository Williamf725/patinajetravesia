'use server'

import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function cambiarContrasena(prevStateOrFormData: unknown, maybeFormData?: FormData) {
  // Soporta tanto llamadas directas como useActionState (prevState, formData)
  let formData: FormData
  if (prevStateOrFormData instanceof FormData) {
    formData = prevStateOrFormData
  } else if (maybeFormData instanceof FormData) {
    formData = maybeFormData
  } else {
    console.error('ERROR: No se recibió un FormData válido en cambiarContrasena')
    return { error: 'Formulario inválido' }
  }

  const token = formData.get('token') as string
  const email = (formData.get('email') as string)?.toLowerCase()?.trim()
  const password = formData.get('password') as string
  const confirmar = formData.get('confirmar') as string

  console.log('=== CAMBIAR CONTRASEÑA ===')
  console.log('Email recibido:', email)
  console.log('Token recibido (primeros 8):', token?.substring(0, 8))
  console.log('Token longitud:', token?.length)

  if (!token || !email) {
    return { error: 'Enlace inválido — faltan parámetros' }
  }

  if (!password || !confirmar) {
    return { error: 'Por favor, completa todos los campos.' }
  }

  if (password !== confirmar) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  if (password.length < 6) {
    return { error: 'Mínimo 6 caracteres.' }
  }

  if (!/\d/.test(password)) {
    return { error: 'Debe incluir al menos un número.' }
  }

  const supabase = await createServerClient()

  // Buscar token usando limit(1) y loguear los detalles
  const { data: alumnos, error: tokenError } = await supabase
    .from('alumnos')
    .select('id, reset_token, reset_token_expiry')
    .eq('email', email)
    .eq('reset_token', token)
    .limit(1)

  console.log('Búsqueda token - encontrado:', alumnos?.length, 'error:', tokenError?.message)
  console.log('Email buscado:', email)
  console.log('Token buscado (primeros 8):', token?.substring(0, 8))

  const alumno = alumnos?.[0] || null

  if (!alumno) {
    console.log('No se encontró alumno con ese token y email')
    return { error: 'Enlace inválido o ya fue usado' }
  }

  if (!alumno.reset_token_expiry || new Date(alumno.reset_token_expiry) < new Date()) {
    return { error: 'El enlace expiró. Solicita uno nuevo.' }
  }

  // Buscar el user_id en auth.users usando el RPC
  const { data: authUserId, error: rpcError } = await supabase
    .rpc('get_user_id_by_email', { user_email: email })

  if (rpcError || !authUserId) {
    console.error('Error llamando RPC get_user_id_by_email:', rpcError)
    return { error: 'No se pudo identificar la cuenta del usuario.' }
  }

  // Usar admin client para cambiar contraseña en Supabase Auth
  const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
    authUserId,
    { password: password }
  )

  if (updateAuthError) {
    console.error('Error al cambiar contraseña con Admin SDK:', updateAuthError)
    return { error: 'Error al cambiar la contraseña. Intenta de nuevo.' }
  }

  // Limpiar el token de reset usado
  const { error: updateAlumnoError } = await supabase
    .from('alumnos')
    .update({
      reset_token: null,
      reset_token_expiry: null
    })
    .eq('id', alumno.id)

  if (updateAlumnoError) {
    console.error('Error limpiando reset_token:', updateAlumnoError)
  }

  return { success: true }
}
