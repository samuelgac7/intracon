/**
 * Servicio de Auditoría General
 * Registra y consulta eventos del sistema
 */

import { supabase } from '@/lib/supabase'

export interface LogAuditoria {
  id?: number
  usuario_id: number
  accion: string
  modulo: string
  detalles?: string
  ip?: string
  user_agent?: string
  fecha: string
  // Relación con usuario
  usuario?: {
    nombre: string
    email: string
  }
}

export interface FiltrosLogs {
  usuarioId?: number
  modulo?: string
  accion?: string
  fechaDesde?: string
  fechaHasta?: string
  limit?: number
}

class AuditoriaService {
  /**
   * Registrar un evento en el log de auditoría
   */
  async registrarEvento(evento: {
    usuarioId: number
    accion: string
    modulo: string
    detalles?: string
  }): Promise<void> {
    try {
      // Obtener user agent del navegador
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null

      const { error } = await supabase
        .from('logs_auditoria')
        .insert({
          usuario_id: evento.usuarioId,
          accion: evento.accion,
          modulo: evento.modulo,
          detalles: evento.detalles,
          user_agent: userAgent
          // No enviar fecha - se usa el DEFAULT NOW() de la base de datos
          // No enviar IP - se podría implementar desde el servidor
        })

      if (error) {
        console.error('Error al registrar evento de auditoría:', error)
      }
    } catch (error) {
      console.error('Error al registrar evento de auditoría:', error)
    }
  }

  /**
   * Obtener logs con filtros
   */
  async getLogs(filtros: FiltrosLogs = {}): Promise<LogAuditoria[]> {
    try {
      let query = supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuario:usuarios!logs_auditoria_usuario_id_fkey(nombre, email)
        `)
        .order('fecha', { ascending: false })

      // Aplicar filtros
      if (filtros.usuarioId) {
        query = query.eq('usuario_id', filtros.usuarioId)
      }

      if (filtros.modulo) {
        query = query.eq('modulo', filtros.modulo)
      }

      if (filtros.accion) {
        query = query.eq('accion', filtros.accion)
      }

      if (filtros.fechaDesde) {
        query = query.gte('fecha', filtros.fechaDesde)
      }

      if (filtros.fechaHasta) {
        query = query.lte('fecha', filtros.fechaHasta)
      }

      if (filtros.limit) {
        query = query.limit(filtros.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error al obtener logs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error al obtener logs:', error)
      return []
    }
  }

  /**
   * Obtener logs de un usuario específico
   */
  async getLogsByUsuario(usuarioId: number, limit: number = 50): Promise<LogAuditoria[]> {
    return this.getLogs({ usuarioId, limit })
  }

  /**
   * Obtener logs de un módulo específico
   */
  async getLogsByModulo(modulo: string, limit: number = 100): Promise<LogAuditoria[]> {
    return this.getLogs({ modulo, limit })
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getEstadisticas(fechaDesde?: string, fechaHasta?: string): Promise<{
    totalEventos: number
    eventosPorModulo: Record<string, number>
    eventosPorAccion: Record<string, number>
    usuariosActivos: number
  }> {
    try {
      let query = supabase
        .from('logs_auditoria')
        .select('*')

      if (fechaDesde) {
        query = query.gte('fecha', fechaDesde)
      }

      if (fechaHasta) {
        query = query.lte('fecha', fechaHasta)
      }

      const { data, error } = await query

      if (error || !data) {
        return {
          totalEventos: 0,
          eventosPorModulo: {},
          eventosPorAccion: {},
          usuariosActivos: 0
        }
      }

      // Calcular estadísticas
      const eventosPorModulo: Record<string, number> = {}
      const eventosPorAccion: Record<string, number> = {}
      const usuariosUnicos = new Set<number>()

      data.forEach(log => {
        // Por módulo
        eventosPorModulo[log.modulo] = (eventosPorModulo[log.modulo] || 0) + 1

        // Por acción
        eventosPorAccion[log.accion] = (eventosPorAccion[log.accion] || 0) + 1

        // Usuarios únicos
        usuariosUnicos.add(log.usuario_id)
      })

      return {
        totalEventos: data.length,
        eventosPorModulo,
        eventosPorAccion,
        usuariosActivos: usuariosUnicos.size
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      return {
        totalEventos: 0,
        eventosPorModulo: {},
        eventosPorAccion: {},
        usuariosActivos: 0
      }
    }
  }


  /**
   * Formatear acción para mostrar
   */
  formatAccion(accion: string): string {
    const mapeo: Record<string, string> = {
      'login': 'Inicio de sesión',
      'logout': 'Cierre de sesión',
      'create': 'Creación',
      'update': 'Modificación',
      'delete': 'Eliminación',
      'export': 'Exportación',
      'import': 'Importación',
      'view': 'Visualización'
    }
    return mapeo[accion] || accion
  }

  /**
   * Formatear módulo para mostrar
   */
  formatModulo(modulo: string): string {
    const mapeo: Record<string, string> = {
      'trabajadores': 'Trabajadores',
      'obras': 'Obras',
      'asistencia': 'Asistencia',
      'documentos': 'Documentos',
      'contratos': 'Contratos',
      'liquidaciones': 'Liquidaciones',
      'usuarios': 'Usuarios',
      'configuracion': 'Configuración',
      'auth': 'Autenticación'
    }
    return mapeo[modulo] || modulo
  }
}

export const auditoriaService = new AuditoriaService()
