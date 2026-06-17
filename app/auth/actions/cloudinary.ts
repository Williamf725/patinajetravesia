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

export async function uploadToCloudinary(formData: FormData) {
  await checkAdmin()

  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'travesia-club',
      },
      async (error, result) => {
        if (error) return reject(error)
        if (!result) return reject(new Error('Upload failed'))

        const supabase = await createClient()
        const { error: dbError } = await supabase.from('galeria').insert({
          url: result.secure_url,
          public_id: result.public_id,
          tipo: result.resource_type === 'video' ? 'video' : 'foto',
          titulo: file.name,
        })

        if (dbError) return reject(dbError)

        revalidatePath('/dashboard')
        revalidatePath('/')
        resolve(result)
      }
    ).end(buffer)
  })
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
