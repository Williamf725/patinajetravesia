'use server'

import crypto from 'crypto'
import { createServerClient } from '@/lib/supabase/server'
import { enviarCorreo } from '@/lib/email/mailer'
import { plantillaRecuperacion } from '@/lib/email/plantillas'

export async function solicitarRecuperacion(_prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.toLowerCase()?.trim()

  if (!email) {
    return { error: 'Ingresa tu correo electrónico' }
  }

  const supabase = await createServerClient()

  // Verificar que el email existe en alumnos
  const { data: alumno, error: queryError } = await supabase
    .from('alumnos')
    .select('id, nombre, email')
    .eq('email', email)
    .maybeSingle()

  if (queryError) {
    console.error('Error buscando alumno:', queryError)
    return { error: 'Error al procesar la solicitud' }
  }

  // Por seguridad, siempre mostrar el mismo mensaje de éxito aunque no exista
  if (!alumno) {
    return { success: true }
  }

  // Generar token único con expiración de 1 hora
  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  // Guardar token en Supabase
  const { error: updateError } = await supabase
    .from('alumnos')
    .update({
      reset_token: token,
      reset_token_expiry: expiry
    })
    .eq('id', alumno.id)

  if (updateError) {
    console.error('Error al guardar token:', updateError)
    return { error: 'Error al generar el enlace de recuperación' }
  }

  // Construir link de recuperación
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://patinajetravesia.vercel.app'
  const link = `${appUrl}/auth/nueva-contrasena?token=${token}&email=${encodeURIComponent(email)}`

  // Enviar correo con Nodemailer
  const mailResult = await enviarCorreo({
    para: email,
    asunto: 'Restablece tu contraseña — Club Travesía',
    html: plantillaRecuperacion(alumno.nombre || 'Alumno', link),
  })

  if (mailResult.error) {
    return { error: mailResult.error }
  }

  return { success: true }
}
