const LOGO = 'https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784734270/40930-removebg-preview_bmvhkt.png'

export function plantillaRecuperacion(nombre: string, linkRecuperacion: string) {
  return `
  <html>
    <body style="background:#0a0a0a;font-family:Arial,sans-serif;padding:40px 20px;margin:0;">
      <div style="max-width:560px;margin:0 auto;background:#111;border:3px solid #ff2d78;padding:40px;border-radius:4px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="${LOGO}" width="140" style="display:inline-block;" alt="Travesía">
        </div>
        <div style="border-top:3px solid #ff2d78;margin-bottom:32px;"></div>
        <h1 style="color:#00ff88;font-size:28px;margin:0 0 8px;letter-spacing:-1px;font-family:Arial Black,sans-serif;">
          CLUB TRAVESÍA
        </h1>
        <p style="color:#ff2d78;font-size:11px;letter-spacing:4px;margin:0 0 32px;text-transform:uppercase;">
          Patinaje de Alto Rendimiento
        </p>
        <h2 style="color:#fff;font-size:20px;margin:0 0 16px;">
          Hola ${nombre}, restablece tu contraseña
        </h2>
        <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 32px;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en Club Travesía.
          Si fuiste tú, haz clic en el botón. Si no solicitaste esto, ignora este mensaje — tu cuenta sigue segura.
        </p>
        <div style="text-align:center;margin-bottom:32px;">
          <a href="${linkRecuperacion}"
            style="display:inline-block;background:#ff2d78;color:#fff;font-weight:bold;
            font-size:14px;letter-spacing:3px;padding:16px 32px;text-decoration:none;
            border:3px solid #ff2d78;box-shadow:4px 4px 0 #00ff88;">
            RESTABLECER CONTRASEÑA
          </a>
        </div>
        <p style="color:#555;font-size:12px;text-align:center;margin:0;line-height:1.6;">
          Este enlace expira en <strong style="color:#fff;">1 hora</strong>.<br>
          Si no solicitaste esto, tu cuenta sigue segura.
        </p>
      </div>
    </body>
  </html>`
}

export function plantillaBienvenida(nombre: string) {
  return `
  <html>
    <body style="background:#0a0a0a;font-family:Arial,sans-serif;padding:40px 20px;margin:0;">
      <div style="max-width:560px;margin:0 auto;background:#111;border:3px solid #00ff88;padding:40px;border-radius:4px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="${LOGO}" width="140" style="display:inline-block;" alt="Travesía">
        </div>
        <div style="border-top:3px solid #00ff88;margin-bottom:32px;"></div>
        <h1 style="color:#00ff88;font-size:28px;margin:0 0 8px;letter-spacing:-1px;font-family:Arial Black,sans-serif;">
          CLUB TRAVESÍA
        </h1>
        <p style="color:#ff2d78;font-size:11px;letter-spacing:4px;margin:0 0 32px;text-transform:uppercase;">
          Patinaje de Alto Rendimiento
        </p>
        <h2 style="color:#fff;font-size:20px;margin:0 0 16px;">
          ¡Bienvenido al parche, ${nombre}! 🛼
        </h2>
        <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Tu cuenta en Club Travesía fue creada exitosamente. Ya puedes acceder a tu portal
          para escoger tu plan de clases y comenzar tu aventura sobre ruedas.
        </p>
        <div style="background:#0a0a0a;border:1px solid #333;padding:20px;margin-bottom:32px;border-radius:4px;">
          <p style="color:#00ff88;font-size:12px;letter-spacing:3px;margin:0 0 12px;text-transform:uppercase;">
            Planes disponibles
          </p>
          <p style="color:#fff;font-size:14px;margin:0 0 8px;">🎫 Clase Individual — $12.000 COP</p>
          <p style="color:#fff;font-size:14px;margin:0 0 8px;">📅 Mensualidad Básica — $40.000 COP (4 clases)</p>
          <p style="color:#fff;font-size:14px;margin:0 0 8px;">📅 Mensualidad Completa — $70.000 COP (8 clases)</p>
          <p style="color:#fff;font-size:14px;margin:0;">📅 Mensualidad Premium — $100.000 COP (12 clases)</p>
        </div>
        <div style="text-align:center;margin-bottom:32px;">
          <a href="https://patinajetravesia.vercel.app/portal"
            style="display:inline-block;background:#00ff88;color:#0a0a0a;font-weight:bold;
            font-size:14px;letter-spacing:3px;padding:16px 32px;text-decoration:none;
            border:3px solid #00ff88;box-shadow:4px 4px 0 #ff2d78;">
            IR A MI PORTAL
          </a>
        </div>
        <p style="color:#555;font-size:12px;text-align:center;margin:0;">
          ¿Tienes dudas? Escríbenos por
          <a href="https://wa.me/573222508676" style="color:#00ff88;">WhatsApp</a>
        </p>
      </div>
    </body>
  </html>`
}
