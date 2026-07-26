'use server'

import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function cambiarContrasena(_prevState: unknown, formData: FormData) {
  const token = formData.get('token') as string
  const email = (formData.get('email') as string)?.toLowerCase()?.trim()
  const password = formData.get('password') as string
  const confirmar = formData.get('confirmar') as string

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

  // Verificar token válido y no expirado en la tabla alumnos
  const { data: alumno, error: queryError } = await supabase
    .from('alumnos')
    .select('id, reset_token, reset_token_expiry')
    .eq('email', email)
    .eq('reset_token', token)
    .maybeSingle()

  if (queryError || !alumno) {
    console.error('Error buscando alumno con token:', queryError)
    return { error: 'Enlace inválido o ya fue usado.' }
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
