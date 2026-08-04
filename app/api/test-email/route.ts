import { NextResponse } from 'next/server'
import { enviarCorreo } from '@/lib/email/mailer'

export async function GET() {
  console.log('=== PRUEBA DE CORREO INICIADA ===')
  console.log('GMAIL_USER:', process.env.GMAIL_USER)
  console.log('APP_PASSWORD existe:', !!process.env.GMAIL_APP_PASSWORD)
  console.log('APP_PASSWORD longitud sin espacios:', process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '').length)
  console.log('APP_PASSWORD primeros 4 chars:', process.env.GMAIL_APP_PASSWORD?.substring(0, 4))

  const resultado = await enviarCorreo({
    para: 'williamfpinilla725@gmail.com',
    asunto: 'Prueba Nodemailer — Club Travesía',
    html: '<h1 style="color:#00ff88">Prueba exitosa ✅</h1><p>Nodemailer está funcionando correctamente.</p>',
  })

  console.log('=== RESULTADO:', JSON.stringify(resultado))

  return NextResponse.json({
    resultado,
    gmailUser: process.env.GMAIL_USER,
    passwordExiste: !!process.env.GMAIL_APP_PASSWORD,
    passwordLongitud: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '').length,
  })
}
