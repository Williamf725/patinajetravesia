import { NextResponse } from 'next/server'
import { enviarCorreo } from '@/lib/email/mailer'

export async function GET() {
  console.log('Iniciando prueba de correo...')
  console.log('GMAIL_USER:', process.env.GMAIL_USER)
  console.log('APP_PASSWORD existe:', !!process.env.GMAIL_APP_PASSWORD)
  console.log('APP_PASSWORD longitud:', process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '').length)

  const resultado = await enviarCorreo({
    para: 'williamfpinilla725@gmail.com',
    asunto: 'Prueba Nodemailer — Club Travesía',
    html: '<h1>Prueba exitosa</h1><p>Nodemailer está funcionando.</p>',
  })

  console.log('Resultado:', JSON.stringify(resultado))

  return NextResponse.json({
    resultado,
    gmailUser: process.env.GMAIL_USER,
    passwordExiste: !!process.env.GMAIL_APP_PASSWORD,
    passwordLongitud: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '').length,
  })
}
