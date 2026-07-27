'use server'

import crypto from 'crypto'
import { createServerClient } from '@/lib/supabase/server'
import { enviarCorreo } from '@/lib/email/mailer'
import { plantillaRecuperacion } from '@/lib/email/plantillas'

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

  console.log('Token guardado:', updateError ? 'ERROR: ' + updateError.message : 'OK')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://patinajetravesia.vercel.app'
  const link = `${baseUrl}/auth/nueva-contrasena?token=${token}&email=${encodeURIComponent(email)}`
  console.log('Link generado:', link)

  const resultadoCorreo = await enviarCorreo({
    para: email,
    asunto: 'Restablece tu contraseña — Club Travesía',
    html: plantillaRecuperacion(alumno.nombre || 'Alumno', link),
  })

  console.log('=== RESULTADO ENVÍO CORREO:', JSON.stringify(resultadoCorreo))

  return { success: true }
}
