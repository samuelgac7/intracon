import { Resend } from 'resend'

// Lazy initialization - solo crear Resend cuando se use
let resendInstance: Resend | null = null
function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY no está configurada en las variables de entorno')
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

// Email remitente (debe estar verificado en Resend)
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const FROM_NAME = 'TECNYCON - Sistema de Gestión'

interface EmailParams {
  to: string
  subject: string
  html: string
}

/**
 * Función genérica para enviar emails
 */
async function sendEmail({ to, subject, html }: EmailParams) {
  try {
    const { data, error } = await getResend().emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html
    })

    if (error) {
      console.error('❌ Error enviando email:', error)
      throw new Error(`Error enviando email: ${error.message}`)
    }

    console.log('✅ Email enviado exitosamente a:', to, 'ID:', data?.id)
    return { success: true, data }
  } catch (error: any) {
    console.error('❌ Error enviando email:', error)
    throw error
  }
}

/**
 * Email de solicitud aprobada
 */
export async function enviarEmailSolicitudAprobada(params: {
  email: string
  nombre: string
  username: string
  password: string
  mensajeAdmin?: string
}) {
  const { email, nombre, username, password, mensajeAdmin } = params

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #0066cc;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border: 1px solid #ddd;
          border-radius: 0 0 8px 8px;
        }
        .credentials {
          background-color: white;
          padding: 20px;
          border-left: 4px solid #10b981;
          margin: 20px 0;
          border-radius: 4px;
        }
        .credentials-item {
          margin: 10px 0;
        }
        .credentials-label {
          font-weight: bold;
          color: #555;
        }
        .credentials-value {
          font-family: 'Courier New', monospace;
          background-color: #f0f0f0;
          padding: 8px 12px;
          border-radius: 4px;
          display: inline-block;
          margin-top: 5px;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .button {
          display: inline-block;
          background-color: #0066cc;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>¡Solicitud Aprobada! 🎉</h1>
      </div>
      <div class="content">
        <p>Hola <strong>${nombre}</strong>,</p>

        <p>Tu solicitud de acceso al Sistema de Gestión de TECNYCON ha sido <strong>aprobada</strong>.</p>

        ${mensajeAdmin ? `
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Mensaje del administrador:</strong></p>
            <p style="margin: 10px 0 0 0;">${mensajeAdmin.replace(/\n/g, '<br>')}</p>
          </div>
        ` : ''}

        <div class="credentials">
          <h3 style="margin-top: 0; color: #10b981;">Tus Credenciales de Acceso</h3>

          <div class="credentials-item">
            <div class="credentials-label">Nombre de usuario:</div>
            <div class="credentials-value">${username}</div>
          </div>

          <div class="credentials-item">
            <div class="credentials-label">Contraseña temporal:</div>
            <div class="credentials-value">${password}</div>
          </div>
        </div>

        <div class="warning">
          <strong>⚠️ Importante:</strong> Por motivos de seguridad, deberás cambiar tu contraseña en el primer inicio de sesión.
        </div>

        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">
            Iniciar Sesión Ahora
          </a>
        </div>

        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
        </p>
      </div>

      <div class="footer">
        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        <p>&copy; ${new Date().getFullYear()} TECNYCON - Constructora. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: '✅ Tu solicitud de acceso ha sido aprobada - TECNYCON',
    html
  })
}

/**
 * Email de solicitud rechazada
 */
export async function enviarEmailSolicitudRechazada(params: {
  email: string
  nombre: string
  mensajeAdmin?: string
}) {
  const { email, nombre, mensajeAdmin } = params

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #dc2626;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border: 1px solid #ddd;
          border-radius: 0 0 8px 8px;
        }
        .message-box {
          background-color: #fee;
          border-left: 4px solid #dc2626;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box {
          background-color: #e7f3ff;
          border-left: 4px solid #0066cc;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Solicitud No Aprobada</h1>
      </div>
      <div class="content">
        <p>Hola <strong>${nombre}</strong>,</p>

        <p>Lamentamos informarte que tu solicitud de acceso al Sistema de Gestión de TECNYCON no ha sido aprobada en este momento.</p>

        ${mensajeAdmin ? `
          <div class="message-box">
            <p style="margin: 0;"><strong>Mensaje del administrador:</strong></p>
            <p style="margin: 10px 0 0 0;">${mensajeAdmin.replace(/\n/g, '<br>')}</p>
          </div>
        ` : ''}

        <div class="info-box">
          <p style="margin: 0;">
            <strong>ℹ️ ¿Necesitas ayuda?</strong><br>
            Si crees que esto es un error o necesitas más información, por favor contacta con el administrador del sistema.
          </p>
        </div>

        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          Gracias por tu interés en utilizar nuestro sistema.
        </p>
      </div>

      <div class="footer">
        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        <p>&copy; ${new Date().getFullYear()} TECNYCON - Constructora. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Actualización sobre tu solicitud de acceso - TECNYCON',
    html
  })
}

export default {
  enviarEmailSolicitudAprobada,
  enviarEmailSolicitudRechazada
}
