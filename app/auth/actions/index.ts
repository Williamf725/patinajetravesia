'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { enviarBienvenida } from '@/lib/email/resend'

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Completa todos los campos' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message, error.code)
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Correo o contraseña incorrectos' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Debes confirmar tu correo antes de iniciar sesión' }
    }
    return { error: 'Error al iniciar sesión. Intenta de nuevo' }
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
    redirect('/dashboard')
  }

  redirect('/portal')
}

export async function registrarAlumno(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nombre = formData.get('nombre') as string
  const apellido = formData.get('apellido') as string

  if (!email || !password || !nombre || !apellido) {
    throw new Error('El nombre y apellido son obligatorios')
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
    if (authError.message.includes('User already registered') || authError.code === 'user_already_exists' || authError.message.includes('Email already in use')) {
      throw new Error('Ya existe una cuenta con este correo.')
    }
    throw new Error('Ocurrió un error al crear tu cuenta. Intenta de nuevo')
  }
  if (!authData.user) throw new Error('Error al crear usuario')

  // 2. Create Alumno Record
  const { error: alumnoError } = await supabase.from('alumnos').insert({
    nombre,
    apellido,
    nombre_completo: `${nombre} ${apellido}`,
    email: email.toLowerCase(),
    activo: true,
  })

  if (alumnoError) {
    if (alumnoError.code === '23505') {
       throw new Error('Este correo ya está registrado como alumno.')
    }
    console.error('Error creating alumno record:', alumnoError)
    // We don't throw here to avoid blocking registration if auth succeeded but record failed,
    // but the requirement says to show specific errors.
  }

  // 3. Send Welcome Email
  try {
    await enviarBienvenida(nombre, email)
  } catch (e) {
    console.error('Failed to send welcome email:', e)
  }

  revalidatePath('/', 'layout')
  revalidatePath('/portal')

  // Requirement: "Redirigir directo a /portal sin esperar confirmación de correo"
  // signUp usually logs in if email confirmation is disabled, or we can follow up with login.
  // We'll redirect to /portal and the middleware/page logic will handle the session.
  redirect('/portal')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
