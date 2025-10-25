/**
 * Servicio de Auditoría de Asistencia
 * Obtiene el historial de cambios de los registros de asistencia
 */

import { supabase } from '@/lib/supabase'

export interface RegistroAuditoria {
  id: number
  registro_asistencia_id: number
  campo_modificado: string
  valor_anterior: string | null
  valor_nuevo: string
  modificado_por: number | null
  fecha_modificacion: string
  ip_address: string | null
  motivo: string | null
  // Relación con usuario
  usuario?: {
    nombre: string
    email: string
  }
}

class AuditoriaAsistenciaService {
  /**
   * Obtener última modificación de un registro
   */
  async getUltimaModificacion(registroId: number): Promise<RegistroAuditoria | null> {
    try {
      const { data, error } = await supabase
        .from('auditoria_asistencia')
        .select(`
          *,
          usuario:usuarios(nombre, email)
        `)
        .eq('registro_asistencia_id', registroId)
        .order('fecha_modificacion', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error al obtener última modificación:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error al obtener última modificación:', error)
      return null
    }
  }

  /**
   * Obtener todo el historial de un registro
   */
  async getHistorialCompleto(registroId: number): Promise<RegistroAuditoria[]> {
    try {
      const { data, error } = await supabase
        .from('auditoria_asistencia')
        .select(`
          *,
          usuario:usuarios(nombre, email)
        `)
        .eq('registro_asistencia_id', registroId)
        .order('fecha_modificacion', { ascending: false })

      if (error) {
        console.error('Error al obtener historial:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error al obtener historial:', error)
      return []
    }
  }

  /**
   * Formatear tiempo relativo (ej: "hace 2 horas")
   */
  formatTiempoRelativo(fecha: string): string {
    const ahora = new Date()
    const fechaModificacion = new Date(fecha)
    const diff = ahora.getTime() - fechaModificacion.getTime()

    const segundos = Math.floor(diff / 1000)
    const minutos = Math.floor(segundos / 60)
    const horas = Math.floor(minutos / 60)
    const dias = Math.floor(horas / 24)

    if (dias > 0) {
      return `hace ${dias} día${dias > 1 ? 's' : ''}`
    } else if (horas > 0) {
      return `hace ${horas} hora${horas > 1 ? 's' : ''}`
    } else if (minutos > 0) {
      return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`
    } else {
      return 'recién'
    }
  }

  /**
   * Formatear campo modificado para mostrar
   */
  formatCampo(campo: string): string {
    const mapeo: Record<string, string> = {
      'estado': 'Estado',
      'horas_extras_50': 'HE 50%',
      'horas_extras_100': 'HE 100%',
      'observaciones': 'Observaciones'
    }
    return mapeo[campo] || campo
  }
}

export const auditoriaAsistenciaService = new AuditoriaAsistenciaService()
