import { NextRequest, NextResponse } from 'next/server'
import { notificacionesService } from '@/services/notificaciones'

/**
 * API Endpoint para enviar notificaciones de contratos por vencer
 *
 * Este endpoint se debe llamar diariamente (por ejemplo, con un cron job)
 * para verificar contratos que vencen en 7 días y enviar notificaciones
 * a los profesionales encargados de cada obra.
 *
 * Seguridad: Requiere API Key en el header
 *
 * Uso:
 * POST /api/notificaciones/contratos-vencer
 * Headers:
 *   x-api-key: <tu-api-key-secreta>
 *
 * O manualmente desde la UI con un botón de admin
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar API Key (opcional pero recomendado para seguridad)
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.CRON_API_KEY || 'dev-key-change-in-production'

    if (apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'No autorizado - API Key inválida' },
        { status: 401 }
      )
    }

    // Ejecutar el proceso de notificaciones
    const resultado = await notificacionesService.enviarNotificacionesContratosProximosVencer()

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: resultado.error || 'Error desconocido'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mensaje: `Notificaciones enviadas exitosamente`,
      notificacionesEnviadas: resultado.notificaciones,
      errores: resultado.errores
    })

  } catch (error) {
    console.error('Error en API /notificaciones/contratos-vencer:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}

/**
 * GET para verificar que el endpoint está funcionando
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/notificaciones/contratos-vencer',
    descripcion: 'Endpoint para enviar notificaciones de contratos por vencer (7 días)',
    metodo: 'POST',
    headers: {
      'x-api-key': 'Requerido - Definir en CRON_API_KEY en .env'
    },
    uso: 'Llamar diariamente con un cron job o manualmente desde la UI'
  })
}
