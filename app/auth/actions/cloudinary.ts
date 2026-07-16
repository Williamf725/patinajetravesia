'use server'

import { v2 as cloudinary } from 'cloudinary'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'clubdepatinajetravesia@gmail.com'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function getSignaturaComprobante() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autorizado')

  const timestamp = Math.round(Date.now() / 1000)
  const folder = 'comprobantes'
  const paramsToSign = { timestamp, folder }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  )

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    folder
  }
}

export async function getSignaturaInscripcion() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autorizado')

  const timestamp = Math.round(Date.now() / 1000)
  const folder = 'comprobantes_inscripcion'
  const paramsToSign = { timestamp, folder }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  )

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    folder
  }
}

export async function getCloudinarySignature() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) throw new Error('Unauthorized')

  const timestamp = Math.round(new Date().getTime() / 1000)
  const folder = 'travesia-club'
  const paramsToSign = { timestamp, folder }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  )

  return {
    signature,
    timestamp,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  }
}

export async function saveToSupabase(data: {
  url: string;
  public_id: string;
  tipo: 'foto' | 'video';
  titulo: string;
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== ADMIN_EMAIL) throw new Error('Unauthorized')

  const { error } = await supabase.from('galeria').insert(data)
  if (error) throw error

  revalidatePath('/dashboard')
}

export async function deleteFromCloudinary(publicId: string, id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== ADMIN_EMAIL) {
    throw new Error('Unauthorized')
  }

  // Use the pre-configured cloudinary instance
  await cloudinary.uploader.destroy(publicId)

  // 2. Delete from Supabase
  const { error } = await supabase.from('galeria').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/dashboard')
}
