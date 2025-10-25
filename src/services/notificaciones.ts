import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'
import { contratosService, type AlertaContrato } from './contratos'
import { getById as getUsuarioById } from './usuarios'

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

const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev'

/**
 * Verificar contratos que vencen en 7 días y enviar notificaciones
 * a los profesionales encargados de cada obra
 */
export async function enviarNotificacionesContratosProximosVencer() {
  try {
    console.log('🔔 Iniciando verificación de contratos por vencer...')

    // Obtener todas las alertas de contratos
    const alertas = await contratosService.getAlertas()

    // Filtrar solo las que vencen en exactamente 7 días
    const alertas7Dias = alertas.filter(a =>
      a.urgencia === 'POR_VENCER' && a.dias_restantes === 7
    )

    if (alertas7Dias.length === 0) {
      console.log('✅ No hay contratos que venzan en 7 días')
      return { success: true, notificaciones: 0 }
    }

    console.log(`📋 Encontrados ${alertas7Dias.length} contratos que vencen en 7 días`)

    // Agrupar alertas por obra
    const alertasPorObra = alertas7Dias.reduce((acc, alerta) => {
      if (!acc[alerta.obra_id]) {
        acc[alerta.obra_id] = {
          obraId: alerta.obra_id,
          obraNombre: alerta.obra_nombre,
          alertas: []
        }
      }
      acc[alerta.obra_id].alertas.push(alerta)
      return acc
    }, {} as Record<number, { obraId: number; obraNombre: string; alertas: AlertaContrato[] }>)

    let notificacionesEnviadas = 0
    const errores: string[] = []

    // Para cada obra, obtener el profesional encargado y enviar notificación
    for (const obraData of Object.values(alertasPorObra)) {
      try {
        // Obtener datos de la obra para saber quién es el encargado
        const { data: obra, error: obraError } = await supabase
          .from('obras')
          .select('id, nombre, encargado_id')
          .eq('id', obraData.obraId)
          .single()

        if (obraError || !obra) {
          console.error(`❌ Error obteniendo obra ${obraData.obraId}:`, obraError)
          errores.push(`Obra ${obraData.obraId}: ${obraError?.message || 'No encontrada'}`)
          continue
        }

        if (!obra.encargado_id) {
          console.log(`⚠️ Obra "${obra.nombre}" no tiene profesional encargado asignado`)
          continue
        }

        // Obtener datos del profesional encargado
        const encargado = await getUsuarioById(obra.encargado_id)

        if (!encargado || !encargado.email) {
          console.log(`⚠️ Profesional encargado ${obra.encargado_id} no tiene email`)
          continue
        }

        // Enviar email al profesional
        await enviarEmailAlertaVencimiento({
          destinatario: {
            nombre: encargado.nombre,
            email: encargado.email
          },
          obra: {
            nombre: obra.nombre
          },
          alertas: obraData.alertas
        })

        notificacionesEnviadas++
        console.log(`✅ Notificación enviada a ${encargado.nombre} (${encargado.email}) para obra "${obra.nombre}"`)

      } catch (error) {
        console.error(`❌ Error procesando obra ${obraData.obraId}:`, error)
        errores.push(`Obra ${obraData.obraId}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    console.log(`🎉 Proceso completado: ${notificacionesEnviadas} notificaciones enviadas`)
    if (errores.length > 0) {
      console.log(`⚠️ Errores encontrados: ${errores.length}`)
      errores.forEach(e => console.log(`  - ${e}`))
    }

    return {
      success: true,
      notificaciones: notificacionesEnviadas,
      errores: errores.length > 0 ? errores : undefined
    }

  } catch (error) {
    console.error('❌ Error fatal en enviarNotificacionesContratosProximosVencer:', error)
    return {
      success: false,
      notificaciones: 0,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Enviar email de alerta de vencimiento a un profesional
 */
async function enviarEmailAlertaVencimiento({
  destinatario,
  obra,
  alertas
}: {
  destinatario: { nombre: string; email: string }
  obra: { nombre: string }
  alertas: AlertaContrato[]
}) {
  const subject = `⚠️ Contratos por vencer en 7 días - ${obra.nombre}`

  // Construir lista de trabajadores
  const listaContratos = alertas
    .map(a => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${a.trabajador_nombre}</strong><br/>
          <span style="color: #6b7280; font-size: 14px;">${a.trabajador_rut}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${a.numero_contrato}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${new Date(a.fecha_termino).toLocaleDateString('es-CL')}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
            ${a.dias_restantes} día${a.dias_restantes !== 1 ? 's' : ''}
          </span>
        </td>
      </tr>
    `)
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                    ⚠️ Alerta de Vencimiento de Contratos
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #fef3c7; font-size: 14px;">
                    Obra: ${obra.nombre}
                  </p>
                </td>
              </tr>

              <!-- Contenido -->
              <tr>
                <td style="padding: 30px;">
                  <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    Hola <strong>${destinatario.nombre}</strong>,
                  </p>

                  <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    Te informamos que los siguientes contratos de trabajadores en la obra <strong>${obra.nombre}</strong>
                    vencerán en <strong>7 días</strong>:
                  </p>

                  <!-- Tabla de contratos -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #f9fafb;">
                        <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">
                          Trabajador
                        </th>
                        <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">
                          N° Contrato
                        </th>
                        <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">
                          Fecha Vencimiento
                        </th>
                        <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">
                          Días Restantes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${listaContratos}
                    </tbody>
                  </table>

                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      <strong>⚠️ Acción Requerida:</strong><br/>
                      Por favor, coordina con el área de Recursos Humanos para generar los anexos de plazo correspondientes
                      antes del vencimiento. Si algún trabajador no continuará, inicia el proceso de finiquito.
                    </p>
                  </div>

                  <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Puedes revisar el detalle completo en la intranet, sección <strong>Recursos Humanos → Gestión Documental</strong>.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    Este es un correo automático del sistema de intranet TECNYCON.<br/>
                    Por favor, no responder a este correo.
                  </p>
                  <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} TECNYCON - Constructora
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: destinatario.email,
    subject,
    html
  })

  if (error) {
    throw new Error(`Error enviando email a ${destinatario.email}: ${error.message}`)
  }

  return { success: true, data }
}

/**
 * Exportar funciones para uso externo
 */
export const notificacionesService = {
  enviarNotificacionesContratosProximosVencer
}
