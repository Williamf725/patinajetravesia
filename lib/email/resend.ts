import { Resend } from 'resend';

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey && process.env.NODE_ENV === 'production') {
    console.warn('RESEND_API_KEY is missing');
  }
  return new Resend(apiKey || 're_123');
};

const FROM_EMAIL = 'Club Travesía <noreply@tudominio.com>'; // Change this to your verified domain

export async function enviarBienvenida(nombre: string, email: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Bienvenido al Club Travesía 🛼',
    html: `
      <div style="background-color: #000; color: white; font-family: sans-serif; padding: 40px; border: 8px solid #b8d300;">
        <h1 style="color: #b8d300; font-size: 40px; text-transform: uppercase; margin-bottom: 20px;">¡HOLA ${nombre.toUpperCase()}!</h1>
        <p style="font-size: 18px; line-height: 1.6;">Bienvenido a la comunidad del <strong>Club Travesía</strong>. Estamos emocionados de tenerte con nosotros.</p>
        <p style="font-size: 16px;">Ya puedes acceder a tu portal para:</p>
        <ul style="color: #ffb1c4; list-style-type: none; padding: 0;">
          <li>⚡ Escoger tu plan de entrenamiento</li>
          <li>⚡ Ver tu asistencia</li>
          <li>⚡ Revisar tu historial de pagos</li>
        </ul>
        <div style="margin-top: 40px;">
          <a href="https://travesia-club.vercel.app/portal" style="background-color: #b8d300; color: black; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; border: 2px solid white;">Ir a mi portal</a>
        </div>
      </div>
    `
  });
}

export async function enviarPlanRechazado(nombre: string, email: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Información sobre tu inscripción - Club Travesía 🔴',
    html: `
      <div style="background-color: #000; color: white; font-family: sans-serif; padding: 40px; border: 8px solid #ffb1c4;">
        <h1 style="color: #ffb1c4; font-size: 30px; text-transform: uppercase;">INSCRIPCIÓN NO PROCESADA</h1>
        <p style="font-size: 18px;">Hola ${nombre}, tu solicitud de plan no pudo ser aprobada.</p>
        <p>Por favor contacta al entrenador por WhatsApp para verificar los detalles del pago.</p>
        <div style="margin-top: 20px;">
           <a href="https://wa.me/573222508676" style="color: #b8d300; font-weight: bold;">Hablar con el entrenador</a>
        </div>
      </div>
    `
  });
}

export async function enviarConfirmacionPlan(nombre: string, email: string, plan: string, precio: number) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Confirmación de Plan - Club Travesía 🛼',
    html: `
      <div style="background-color: #000; color: white; font-family: sans-serif; padding: 40px; border: 8px solid #ffb1c4;">
        <h1 style="color: #ffb1c4; font-size: 30px; text-transform: uppercase;">PLAN SELECCIONADO</h1>
        <p style="font-size: 18px;">Hola ${nombre}, has seleccionado el plan: <strong>${plan}</strong></p>
        <div style="background-color: #1a1a1a; padding: 20px; border-left: 4px solid #ffb1c4; margin: 20px 0;">
          <p style="margin: 0; font-size: 24px; color: #ffb1c4;">Total: $${precio.toLocaleString()}</p>
        </div>
        <p style="font-size: 14px; color: #888;">Recuerda que el pago se realiza directamente con el entrenador en las sesiones de entrenamiento. Una vez pagado, tu plan será aprobado en el portal.</p>
      </div>
    `
  });
}

export async function enviarNotificacionAdmin(nombreAlumno: string, emailAlumno: string, plan: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: 'clubdepatinajetravesia@gmail.com',
    subject: 'Nueva Inscripción Pendiente ⚡',
    html: `
      <div style="background-color: #131313; color: white; font-family: monospace; padding: 20px;">
        <h2 style="color: #b8d300;">NUEVA INSCRIPCIÓN</h2>
        <p><strong>Alumno:</strong> ${nombreAlumno}</p>
        <p><strong>Email:</strong> ${emailAlumno}</p>
        <p><strong>Plan:</strong> ${plan}</p>
        <hr style="border: 1px dashed #333;" />
        <p>Revisa el panel de control para aprobar el pago.</p>
      </div>
    `
  });
}

export async function enviarPlanAprobado(nombre: string, email: string, plan: string, clasesIncluidas: number) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '¡Tu plan ha sido aprobado! 🟢',
    html: `
      <div style="background-color: #000; color: white; font-family: sans-serif; padding: 40px; border: 8px solid #b8d300;">
        <h1 style="color: #b8d300; font-size: 30px; text-transform: uppercase;">PAGO CONFIRMADO</h1>
        <p style="font-size: 18px;">¡Excelente ${nombre}! Tu plan <strong>${plan}</strong> ya está activo.</p>
        <p style="font-size: 16px;">Clases disponibles este mes: <strong>${clasesIncluidas}</strong></p>
        <p>¡Nos vemos en la pista! 🛼</p>
      </div>
    `
  });
}

export async function enviarPlanPorAcabar(nombre: string, email: string, clasesRestantes: number) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Aviso de Clases ⚠️ Club Travesía',
    html: `
      <div style="background-color: #000; color: white; font-family: sans-serif; padding: 40px; border: 8px solid #ff5f1f;">
        <h1 style="color: #ff5f1f; font-size: 30px; text-transform: uppercase;">AVISO DE CLASES</h1>
        <p style="font-size: 18px;">Hola ${nombre}, te informamos que te queda <strong>${clasesRestantes} clase</strong> disponible en tu plan actual.</p>
        <p>Recuerda renovar tu plan en el portal para seguir rodando sin interrupciones.</p>
      </div>
    `
  });
}
