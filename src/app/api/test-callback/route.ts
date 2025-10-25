import { NextResponse } from 'next/server'
import solicitudesAccesoService from '@/services/solicitudesAcceso'

export async function GET() {
  try {
    console.log('🧪 Test API: Iniciando prueba de solicitud...')

    // Intentar crear una solicitud de prueba
    const solicitud = await solicitudesAccesoService.create({
      email: 'test-api@tecnycon.cl',
      nombre: 'Test API Usuario',
      auth_provider: 'manual',
      mensaje_solicitud: 'Test desde API route'
    })

    console.log('✅ Test API: Solicitud creada:', solicitud)

    // Intentar obtener todas las solicitudes
    const todas = await solicitudesAccesoService.getAll()
    console.log('✅ Test API: Total solicitudes:', todas.length)

    return NextResponse.json({
      success: true,
      solicitudCreada: solicitud,
      totalSolicitudes: todas.length,
      solicitudes: todas
    })
  } catch (error: any) {
    console.error('❌ Test API: Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString(),
      stack: error.stack
    }, { status: 500 })
  }
}
