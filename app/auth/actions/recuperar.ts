'use server'

import crypto from 'crypto'
import { createServerClient } from '@/lib/supabase/server'
import { enviarCorreo } from '@/lib/email/mailer'
import { plantillaRecuperacion } from '@/lib/email/plantillas'
import { allowRequest } from '@/lib/security'

export async function solicitarRecuperacion(prevStateOrFormData: unknown, maybeFormData?: FormData) {
  // Soporta tanto llamadas directas como firmas de useActionState (prevState, formData)
  let formData: FormData
  if (prevStateOrFormData instanceof FormData) {
    formData = prevStateOrFormData
  } else if (maybeFormData instanceof FormData) {
    formData = maybeFormData
  } else {
    console.error('ERROR: No se recibió un FormData válido en solicitarRecuperacion')
    return { error: 'Formulario inválido' }
  }

  const email = (formData.get('email') as string)?.toLowerCase()?.trim()
  console.log('=== SOLICITUD RECUPERACIÓN para:', email)

  if (!email) {
    return { error: 'Ingresa tu correo electrónico' }
  }

  if (!(await allowRequest('recuperar', email, 4, 60 * 60))) {
    return { error: 'Demasiadas solicitudes. Espera una hora e inténtalo de nuevo.' }
  }

  const supabase = await createServerClient()

  const { data: alumno, error: alumnoError } = await supabase
    .from('alumnos')
    .select('id, nombre, email')
    .eq('email', email)
    .single()

  console.log('Alumno encontrado:', alumno ? 'SÍ' : 'NO', alumnoError?.message)

  if (!alumno) {
    console.log('No se encontró alumno con email:', email)
    return { success: true }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const { error: updateError } = await supabase
    .from('alumnos')
    .update({ reset_token: token, reset_token_expiry: expiry })
    .eq('id', alumno.id)

  if (updateError) {
    console.error('No se pudo guardar el token de recuperación:', updateError.message)
    return { error: 'No pudimos procesar la solicitud. Inténtalo de nuevo.' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://patinajetravesia.vercel.app'
  const link = `${baseUrl}/auth/nueva-contrasena?token=${token}&email=${encodeURIComponent(email)}`

  const resultadoCorreo = await enviarCorreo({
    para: email,
    asunto: 'Restablece tu contraseña — Club Travesía',
    html: plantillaRecuperacion(alumno.nombre || 'Alumno', link),
  })

  if (resultadoCorreo.error) {
    console.error('No se pudo enviar el correo de recuperación:', resultadoCorreo.error)
    return { error: 'No pudimos enviar el enlace. Inténtalo de nuevo en unos minutos.' }
  }

  return { success: true }
}

