import nodemailer from 'nodemailer'

export async function enviarCorreo({
  para,
  asunto,
  html,
}: {
  para: string
  asunto: string
  html: string
}) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('ERROR CRÍTICO: Faltan variables GMAIL_USER o GMAIL_APP_PASSWORD')
    return { error: 'Configuración de correo incompleta' }
  }

  const appPassword = process.env.GMAIL_APP_PASSWORD.replace(/\s/g, '')

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: appPassword,
    },
  })

  try {
    await transporter.verify()
    console.log('✅ Conexión SMTP verificada')

    const info = await transporter.sendMail({
      from: `"Club Travesía 🛼" <${process.env.GMAIL_USER}>`,
      to: para,
      subject: asunto,
      html,
    })

    console.log('✅ Correo enviado:', info.messageId, '→', para)
    return { success: true, messageId: info.messageId }

  } catch (error) {
    console.error('❌ Error Nodemailer:', JSON.stringify(error, null, 2))
    return { error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}
