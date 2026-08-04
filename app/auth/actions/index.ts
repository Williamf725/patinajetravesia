'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { enviarCorreo } from '@/lib/email/mailer'
import { plantillaBienvenida } from '@/lib/email/plantillas'

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirect') as string) || '/portal'

  if (!email || !password) {
    return { error: 'Completa todos los campos' }
  }

  const supabase = await createServerClient()

  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (loginError) {
    const msg = loginError.message.toLowerCase()

    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return { error: 'Correo o contraseña incorrectos.' }
    }
    if (msg.includes('email not confirmed')) {
      return { error: 'Debes confirmar tu correo antes de entrar.' }
    }
    if (msg.includes('too many requests') || loginError.code === 'over_request_rate_limit') {
      return { error: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.' }
    }

    console.error('Login error:', loginError.code, loginError.message)
    return { error: 'Error al iniciar sesión. Intenta de nuevo.' }
  }

  if (!data.user) {
    console.error('Login error: No user returned after success')
    return { error: 'No se pudo iniciar sesión. Intenta de nuevo' }
  }

  // Log the login event if log table exists
  try {
    const userAgent = (await headers()).get('user-agent')
    await supabase.from('login_logs').insert({
      user_id: data.user.id,
      email: data.user.email,
      user_agent: userAgent,
    })
  } catch (e) {
    console.error('Failed to log login event:', e)
  }

  revalidatePath('/', 'layout')

  // Redirección fuera del try/catch
  const ADMIN_EMAIL = 'clubdepatinajetravesia@gmail.com'
  if (data.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return redirect('/dashboard')
  }

  return redirect(redirectTo)
}

export async function registrarAlumno(_prevState: unknown, formData: FormData) {
  const supabase = await createServerClient()

  const email = (formData.get('email') as string)?.toLowerCase()
  const password = formData.get('password') as string
  const nombre = formData.get('nombre') as string
  const apellido = formData.get('apellido') as string

  if (!email || !password || !nombre || !apellido) {
    return { error: 'Todos los campos son obligatorios.', field: 'general' }
  }

  // 1. Create Auth User
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
        apellido,
      }
    }
  })

  if (authError) {
    const msg = authError.message.toLowerCase()
    const code = authError.code

    if (
      msg.includes('user already registered') ||
      msg.includes('already been registered') ||
      msg.includes('email already in use') ||
      code === 'user_already_exists' ||
      code === 'email_exists'
    ) {
      return { error: 'Este correo ya tiene una cuenta registrada.', field: 'email', showLogin: true }
    }

    if (msg.includes('invalid email') || code === 'invalid_email') {
      return { error: 'El correo electrónico no es válido.', field: 'email' }
    }

    if (msg.includes('password') && msg.includes('weak')) {
      return { error: 'La contraseña es muy débil. Usa mínimo 6 caracteres con números.', field: 'password' }
    }

    console.error('Auth error desconocido:', authError.code, authError.message)
    return { error: `Error al crear la cuenta: ${authError.message}`, field: 'general' }
  }

  if (!authData.user) return { error: 'Error al crear usuario', field: 'general' }

  // 2. Create Alumno Record
  const { error: alumnoError } = await supabase.from('alumnos').insert({
    nombre,
    apellido,
    nombre_completo: `${nombre} ${apellido}`,
    email: email,
    tipo_documento: formData.get('tipoDocumento') as string,
    numero_documento: formData.get('numeroDocumento') as string,
    telefono: formData.get('telefono') as string,
    fecha_nacimiento: `${formData.get('anioNacimiento')}-${String(formData.get('mes')).padStart(2, '0')}-${String(formData.get('dia')).padStart(2, '0')}`,
    perfil_completo: true,
    activo: true,
  })

  if (alumnoError) {
    if (alumnoError.code === '23505') {
       return { error: 'Este correo ya está registrado como alumno.', field: 'email', showLogin: true }
    }
    console.error('Error creating alumno record:', alumnoError)
  }

  // 3. Send Welcome Email
  enviarCorreo({
    para: email,
    asunto: '¡Bienvenido al Club Travesía! 🛼',
    html: plantillaBienvenida(nombre),
  }).catch(err => console.error('Error enviando bienvenida:', err))

  revalidatePath('/', 'layout')
  revalidatePath('/portal')

  return redirect('/portal')
}

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  return redirect('/')
}
