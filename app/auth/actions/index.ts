'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

const ADMIN_EMAIL = 'patinajetravesia@gmail.com'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
     return // Handled client-side now, but for safety
  }

  // Strict restriction: Only allow the specific admin email
  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Acceso Denegado: Usuario no autorizado')
  }

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

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
