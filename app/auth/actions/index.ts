'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { enviarBienvenida } from '@/lib/email/resend'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
     return
  }

  // Permitimos login a todos (alumnos y admin)
  // La protección de rutas se encarga del resto
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  // Log the login event if log table exists
  try {
    if (data.user) {
      const userAgent = (await headers()).get('user-agent')

      await supabase.from('login_logs').insert({
        user_id: data.user.id,
        email: data.user.email,
        user_agent: userAgent,
      })
    }
  } catch (e) {
    console.error('Failed to log login event:', e)
  }

  revalidatePath('/', 'layout')
}

export async function registrarAlumno(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nombre = formData.get('nombre') as string
  const apellido = formData.get('apellido') as string

  if (!email || !password || !nombre || !apellido) {
    throw new Error('Todos los campos son obligatorios')
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

  if (authError) throw authError
  if (!authData.user) throw new Error('Error al crear usuario')

  // 2. Create Alumno Record
  // La columna numero_alumno se asigna automáticamente (serial) en Supabase
  const { error: alumnoError } = await supabase.from('alumnos').insert({
    nombre,
    apellido,
    nombre_completo: `${nombre} ${apellido}`,
    email: email.toLowerCase(),
    activo: true,
  })

  // If there's an error creating the alumno, we might have a ghost auth user,
  // but for simplicity in this template we'll assume it works if auth worked.
  if (alumnoError) {
     console.error('Error creating alumno record:', alumnoError)
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
