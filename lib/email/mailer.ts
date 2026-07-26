import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function enviarCorreo({
  para,
  asunto,
  html,
}: {
  para: string
  asunto: string
  html: string
}) {
  try {
    await transporter.sendMail({
      from: `"Club Travesía 🛼" <${process.env.GMAIL_USER}>`,
      to: para,
      subject: asunto,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Error enviando correo:', error)
    return { error: 'No se pudo enviar el correo' }
  }
}
