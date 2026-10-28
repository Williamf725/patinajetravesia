import React from 'react'
import NuevaContrasenaClient from './NuevaContrasenaClient'

interface PageProps {
  searchParams: Promise<{ token?: string; email?: string }>
}

export default async function NuevaContrasenaPage({ searchParams }: PageProps) {
  const params = await searchParams
  const token = params.token || ''
  const email = params.email || ''

  console.log('Página nueva contraseña - token existe:', !!token, 'email:', email)

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black text-white text-center">
        <p className="font-space text-lg">Enlace inválido. Solicita uno nuevo.</p>
      </div>
    )
  }

  return <NuevaContrasenaClient token={token} email={email} />
}
