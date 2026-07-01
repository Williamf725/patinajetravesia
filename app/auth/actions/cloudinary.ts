'use server'

import { v2 as cloudinary } from 'cloudinary'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ADMIN_EMAIL = 'clubdepatinajetravesia@gmail.com'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== ADMIN_EMAIL) {
    throw new Error('Unauthorized')
  }
}

async function checkAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function getCloudinarySignature() {
  await checkAuth()

  const timestamp = Math.round(new Date().getTime() / 1000)
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: 'travesia-club',
    },
    process.env.CLOUDINARY_API_SECRET!
  )

  return {
    signature,
    timestamp,
    api_key: process.env.CLOUDINARY_API_KEY!,
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  }
}

export async function saveToSupabase(data: {
  url: string;
  public_id: string;
  tipo: 'foto' | 'video';
  titulo: string;
}) {
  await checkAdmin()

  const supabase = await createClient()
  const { error: dbError } = await supabase.from('galeria').insert(data)

  if (dbError) throw dbError

  revalidatePath('/dashboard')
  revalidatePath('/')
}

export async function deleteFromCloudinary(publicId: string, id: string) {
  await checkAdmin()

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: publicId.includes('video') ? 'video' : 'image' // Cloudinary sometimes needs hint
  })

  // If destroy fails for video because of resource_type, we might need a more robust check
  // but let's try auto or specific check

  const supabase = await createClient()
  const { error } = await supabase.from('galeria').delete().eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard')
  revalidatePath('/')
  return result
}
