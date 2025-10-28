import { supabase } from '@/lib/supabase'
import { enviarEmailSolicitudAprobada, enviarEmailSolicitudRechazada } from './email'

export interface SolicitudAcceso {
  id: number
  email: string
  nombre: string
  auth_provider: 'google' | 'manual'
  auth_user_id?: string
  estado: 'pendiente' | 'aprobada' | 'rechazada'
  rol_solicitado?: string
  mensaje_solicitud?: string
  mensaje_admin?: string
  usuario_id?: number
  aprobada_por?: number
  fecha_solicitud: string
  fecha_respuesta?: string
  created_at: string
  updated_at: string
}

class SolicitudesAccesoService {
  // Crear solicitud de acceso
  async create(data: {
    email: string
    nombre: string
    auth_provider: 'google' | 'manual'
    auth_user_id?: string
    rol_solicitado?: string
    mensaje_solicitud?: string
  }): Promise<SolicitudAcceso> {
    const { data: solicitud, error } = await supabase
      .from('solicitudes_acceso')
      .insert([{
        email: data.email,
        nombre: data.nombre,
        auth_provider: data.auth_provider,
        auth_user_id: data.auth_user_id,
        rol_solicitado: data.rol_solicitado,
        mensaje_solicitud: data.mensaje_solicitud,
        estado: 'pendiente'
      }])
      .select()
      .maybeSingle()

    if (error) {
      // Si ya existe una solicitud, obtenerla
      if (error.code === '23505') { // unique violation
        const { data: existing } = await supabase
          .from('solicitudes_acceso')
          .select('*')
          .eq('email', data.email)
          .maybeSingle()

        if (existing) return existing
      }
      throw error
    }

    return solicitud
  }

  // Obtener solicitud por email
  async getByEmail(email: string): Promise<SolicitudAcceso | null> {
    const { data, error } = await supabase
      .from('solicitudes_acceso')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) return null
    return data
  }

  // Obtener solicitud por auth_user_id
  async getByAuthUserId(authUserId: string): Promise<SolicitudAcceso | null> {
    const { data, error } = await supabase
      .from('solicitudes_acceso')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error) return null
    return data
  }

  // Obtener todas las solicitudes pendientes (solo para admin)
  async getPendientes(): Promise<SolicitudAcceso[]> {
    const { data, error } = await supabase
      .from('solicitudes_acceso')
      .select('*')
      .eq('estado', 'pendiente')
      .order('fecha_solicitud', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Obtener todas las solicitudes (solo para admin)
  async getAll(): Promise<SolicitudAcceso[]> {
    const { data, error } = await supabase
      .from('solicitudes_acceso')
      .select('*')
      .order('fecha_solicitud', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Contar solicitudes pendientes
  async countPendientes(): Promise<number> {
    const { count, error } = await supabase
      .from('solicitudes_acceso')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente')

    if (error) return 0
    return count || 0
  }

  // Aprobar solicitud
  async aprobar(
    solicitudId: number,
    adminId: number,
    usuarioData: {
      nombre: string
      email: string
      rut?: string
      cargo?: string
      rol: 'profesional' | 'visitador' | 'gerente' | 'super-admin'
      foto?: string
    },
    username: string,
    password: string,
    mensajeAdmin?: string
  ): Promise<{ solicitud: SolicitudAcceso; usuario: any }> {
    // Verificar que la solicitud existe y está pendiente
    const { data: solicitudExistente, error: errorConsulta } = await supabase
      .from('solicitudes_acceso')
      .select('*')
      .eq('id', solicitudId)
      .maybeSingle()

    if (errorConsulta) throw errorConsulta
    if (!solicitudExistente) throw new Error('Solicitud no encontrada')
    if (solicitudExistente.estado !== 'pendiente') {
      throw new Error(`Esta solicitud ya fue ${solicitudExistente.estado}`)
    }

    // Crear usuario en tabla usuarios con credenciales
    const usuariosModule = await import('./usuarios')

    // Generar RUT temporal único si no se proporciona
    const rutFinal = usuarioData.rut && usuarioData.rut.trim() !== ''
      ? usuarioData.rut
      : `TEMP-${Date.now()}-${Math.random().toString(36).substring(7)}`

    const nuevoUsuario = await usuariosModule.create({
      ...usuarioData,
      rut: rutFinal,
      telefono: undefined,
      fecha_ingreso: new Date().toISOString(),
      activo: true,
      credenciales: {
        username,
        passwordHash: '', // Se sobrescribirá por el service
        mustChangePassword: true,
        intentosFallidos: 0
      },
      permisos: {
        trabajadores: { ver: true, crear: false, editar: false, eliminar: false },
        obras: { ver: true, crear: false, editar: false, eliminar: false },
        documentos: { ver: true, subir: false, eliminar: false },
        reportes: { ver: true, generar: false },
        configuracion: { ver: false, editar: false },
        finanzas: { ver: false, editar: false }
      },
      obras_asignadas: null // Acceso a todas las obras por defecto
    }, password)

    if (!nuevoUsuario || !nuevoUsuario.id) {
      throw new Error('Error al crear el usuario')
    }

    // Actualizar solicitud
    const { data: solicitud, error } = await supabase
      .from('solicitudes_acceso')
      .update({
        estado: 'aprobada',
        usuario_id: nuevoUsuario.id,
        aprobada_por: adminId,
        mensaje_admin: mensajeAdmin,
        fecha_respuesta: new Date().toISOString()
      })
      .eq('id', solicitudId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error actualizando solicitud:', error)
      throw new Error(`Error actualizando solicitud: ${error instanceof Error ? error.message : String(error)}`)
    }

    if (!solicitud) {
      throw new Error('No se pudo actualizar la solicitud')
    }

    // Enviar email de aprobación (solo si estamos en el servidor)
    if (typeof window === 'undefined' && process.env.RESEND_API_KEY) {
      try {
        await enviarEmailSolicitudAprobada({
          email: usuarioData.email,
          nombre: usuarioData.nombre,
          username,
          password,
          mensajeAdmin
        })
        console.log('✅ Email de aprobación enviado a:', usuarioData.email)
      } catch (emailError: any) {
        console.error('⚠️ Error enviando email de aprobación:', emailError)
        // No lanzamos el error para que la aprobación se complete igual
        // El usuario se creó correctamente, solo falló el email
      }
    }

    return { solicitud, usuario: nuevoUsuario }
  }

  // Rechazar solicitud
  async rechazar(
    solicitudId: number,
    adminId: number,
    mensajeAdmin?: string
  ): Promise<SolicitudAcceso> {
    console.log('🔴 Rechazando solicitud:', { solicitudId, adminId, mensajeAdmin })

    const { data, error } = await supabase
      .from('solicitudes_acceso')
      .update({
        estado: 'rechazada',
        aprobada_por: adminId,
        mensaje_admin: mensajeAdmin,
        fecha_respuesta: new Date().toISOString()
      })
      .eq('id', solicitudId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('❌ Error rechazando solicitud:', error)
      throw error
    }

    if (!data) {
      console.error('❌ No se retornó data después del update')
      throw new Error('No se pudo actualizar la solicitud')
    }

    console.log('✅ Solicitud rechazada exitosamente:', data)

    // Enviar email de rechazo (solo si estamos en el servidor)
    if (typeof window === 'undefined' && process.env.RESEND_API_KEY) {
      try {
        await enviarEmailSolicitudRechazada({
          email: data.email,
          nombre: data.nombre,
          mensajeAdmin
        })
        console.log('✅ Email de rechazo enviado a:', data.email)
      } catch (emailError: any) {
        console.error('⚠️ Error enviando email de rechazo:', emailError)
        // No lanzamos el error para que el rechazo se complete igual
      }
    }

    return data
  }
}

const solicitudesAccesoService = new SolicitudesAccesoService()
export default solicitudesAccesoService
