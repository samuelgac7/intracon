/**
 * Servicio para gestión de Asistencia MEJORADO
 * Sistema completo para construcción con estados, horas extras y exportación
 */

import { supabase } from '@/lib/supabase'

export type EstadoAsistencia = 'OK' | 'F' | 'J' | 'A' | 'L' | 'BT' | 'BTR' | 'R'

export interface RegistroAsistencia {
  id?: number
  trabajador_id: number
  obra_id: number
  fecha: string // YYYY-MM-DD

  // Marcaciones
  hora_entrada?: string
  hora_salida?: string
  hora_entrada_tarde?: string
  hora_salida_tarde?: string

  // Cálculos automáticos
  horas_trabajadas?: number
  horas_extras_50?: number
  horas_extras_100?: number

  // Estado
  estado: EstadoAsistencia
  es_dia_trabajo?: boolean

  // Observaciones
  observaciones?: string
  justificacion_archivo?: string

  // Geolocalización
  latitud?: number
  longitud?: number
  ubicacion_verificada?: boolean

  // Auditoría
  registrado_por?: number
  aprobado_por?: number
  fecha_aprobacion?: string

  created_at?: string
  updated_at?: string
}

export interface RegistroAsistenciaConTrabajador extends RegistroAsistencia {
  trabajador_nombre: string
  trabajador_rut: string
  trabajador_cargo: string
  obra_nombre: string
}

export interface ResumenAsistenciaMensual {
  trabajador_id: number
  trabajador_nombre: string
  trabajador_rut: string
  trabajador_cargo: string
  anio: number
  mes: number
  dias_registrados: number
  dias_ok: number
  dias_falta: number
  dias_justificativo: number
  dias_accidente: number
  dias_licencia: number
  dias_bajada_tomada: number
  dias_bajada_trabajada: number
  dias_renuncia: number
  total_horas_trabajadas: number
  total_horas_extras_50: number
  total_horas_extras_100: number
  promedio_horas_diarias: number
}

export interface DatosDiaAsistencia {
  dia: number
  estado: EstadoAsistencia | ''
  he_50: number
  he_100: number
}

export interface DatosExportacionExcel {
  trabajador_id: number
  nombre: string
  rut: string
  cargo: string
  dias: DatosDiaAsistencia[]
  total_ok: number
  total_f: number
  total_j: number
  total_a: number
  total_l: number
  total_bt: number
  total_btr: number
  total_r: number
  total_he_50: number
  total_he_100: number
}

export interface CreateAsistenciaDTO {
  trabajador_id: number
  obra_id: number
  fecha: string
  estado: EstadoAsistencia
  hora_entrada?: string
  hora_salida?: string
  hora_entrada_tarde?: string
  hora_salida_tarde?: string
  horas_extras_50?: number
  horas_extras_100?: number
  observaciones?: string
  latitud?: number
  longitud?: number
}

export interface MarcarAsistenciaMasivaDTO {
  obra_id: number
  fecha: string
  registros: {
    trabajador_id: number
    estado: EstadoAsistencia
    horas_extras_50?: number
    horas_extras_100?: number
    observaciones?: string
  }[]
}

/**
 * Servicio de Asistencia Mejorado
 */
export const asistenciaService = {
  /**
   * Obtener registros de asistencia de una obra en un mes
   */
  async getByObraYMes(obraId: number, mes: number, anio: number): Promise<RegistroAsistencia[]> {
    const fechaInicio = `${anio}-${mes.toString().padStart(2, '0')}-01`
    const ultimoDia = new Date(anio, mes, 0).getDate()
    const fechaFin = `${anio}-${mes.toString().padStart(2, '0')}-${ultimoDia}`

    const { data, error } = await supabase
      .from('registros_asistencia')
      .select('*')
      .eq('obra_id', obraId)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: true })

    if (error) {
      console.error('Error al obtener asistencia:', error)
      throw error
    }

    return data || []
  },

  /**
   * Obtener asistencia de un día específico en una obra
   */
  async getByObraYFecha(obraId: number, fecha: string): Promise<RegistroAsistenciaConTrabajador[]> {
    const { data, error } = await supabase
      .from('registros_asistencia')
      .select(`
        *,
        trabajador:trabajadores!inner(nombre, rut, cargo),
        obra:obras!inner(nombre)
      `)
      .eq('obra_id', obraId)
      .eq('fecha', fecha)
      .order('trabajador(nombre)')

    if (error) {
      console.error('Error al obtener asistencia del día:', error)
      throw error
    }

    return (data || []).map((r: any) => ({
      ...r,
      trabajador_nombre: r.trabajador.nombre,
      trabajador_rut: r.trabajador.rut,
      trabajador_cargo: r.trabajador.cargo,
      obra_nombre: r.obra.nombre
    }))
  },

  /**
   * Crear o actualizar registro de asistencia
   */
  async upsert(dto: CreateAsistenciaDTO, registradoPor?: number): Promise<RegistroAsistencia> {
    // Verificar si ya existe
    const { data: existente, error: errorBusqueda } = await supabase
      .from('registros_asistencia')
      .select('id')
      .eq('trabajador_id', dto.trabajador_id)
      .eq('fecha', dto.fecha)
      .eq('obra_id', dto.obra_id)
      .maybeSingle()

    // Ignorar error si no existe (es normal en un upsert)
    if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
      console.error('Error buscando registro existente:', errorBusqueda)
      throw errorBusqueda
    }

    if (existente) {
      // Actualizar
      const { data, error } = await supabase
        .from('registros_asistencia')
        .update({
          estado: dto.estado,
          hora_entrada: dto.hora_entrada,
          hora_salida: dto.hora_salida,
          hora_entrada_tarde: dto.hora_entrada_tarde,
          hora_salida_tarde: dto.hora_salida_tarde,
          horas_extras_50: dto.horas_extras_50,
          horas_extras_100: dto.horas_extras_100,
          observaciones: dto.observaciones,
          latitud: dto.latitud,
          longitud: dto.longitud,
          ubicacion_verificada: dto.latitud && dto.longitud ? true : false
        })
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Crear
      const { data, error } = await supabase
        .from('registros_asistencia')
        .insert([{
          ...dto,
          registrado_por: registradoPor,
          ubicacion_verificada: dto.latitud && dto.longitud ? true : false
        }])
        .select()
        .single()

      if (error) throw error
      return data
    }
  },

  /**
   * Marcar asistencia masiva para una fecha
   */
  async marcarMasiva(dto: MarcarAsistenciaMasivaDTO, registradoPor?: number): Promise<{ exitosos: number; errores: string[] }> {
    const errores: string[] = []
    let exitosos = 0

    for (const registro of dto.registros) {
      try {
        await this.upsert(
          {
            trabajador_id: registro.trabajador_id,
            obra_id: dto.obra_id,
            fecha: dto.fecha,
            estado: registro.estado,
            horas_extras_50: registro.horas_extras_50,
            horas_extras_100: registro.horas_extras_100,
            observaciones: registro.observaciones
          },
          registradoPor
        )
        exitosos++
      } catch (error) {
        errores.push(`Trabajador ${registro.trabajador_id}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    return { exitosos, errores }
  },

  /**
   * Obtener trabajadores de una obra con su asistencia del día
   */
  async getTrabajadoresConAsistencia(obraId: number, fecha: string) {
    // Obtener trabajadores asignados a la obra
    const { data: trabajadores, error: errorTrabajadores } = await supabase
      .from('trabajadores_obras')
      .select(`
        trabajador:trabajadores!inner(
          id,
          nombre,
          rut,
          cargo,
          foto
        )
      `)
      .eq('obra_id', obraId)
      .eq('activo', true)

    if (errorTrabajadores) throw errorTrabajadores

    // Obtener asistencia del día
    const { data: asistencias } = await supabase
      .from('registros_asistencia')
      .select('*')
      .eq('obra_id', obraId)
      .eq('fecha', fecha)

    const asistenciaMap = new Map(asistencias?.map(a => [a.trabajador_id, a]) || [])

    return (trabajadores || []).map((t: any) => ({
      ...t.trabajador,
      asistencia: asistenciaMap.get(t.trabajador.id) || null
    }))
  },

  /**
   * Obtener datos formateados para exportación a Excel
   */
  async getDatosExcel(obraId: number, mes: number, anio: number): Promise<DatosExportacionExcel[]> {
    const { data, error } = await supabase.rpc('obtener_asistencia_excel', {
      p_obra_id: obraId,
      p_mes: mes,
      p_anio: anio
    })

    if (error) {
      console.error('Error al obtener datos para Excel:', error)
      throw error
    }

    return data || []
  },

  /**
   * Obtener resumen mensual
   */
  async getResumenMensual(mes: number, anio: number, trabajadorId?: number): Promise<ResumenAsistenciaMensual[]> {
    let query = supabase
      .from('resumen_asistencia_mensual')
      .select('*')
      .eq('mes', mes)
      .eq('anio', anio)

    if (trabajadorId) {
      query = query.eq('trabajador_id', trabajadorId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  /**
   * Eliminar registro
   */
  async eliminar(id: number): Promise<void> {
    const { error } = await supabase
      .from('registros_asistencia')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Obtener historial de cambios de un registro
   */
  async getAuditoria(registroId: number) {
    const { data, error } = await supabase
      .from('auditoria_asistencia')
      .select(`
        *,
        usuario:usuarios(nombre)
      `)
      .eq('registro_asistencia_id', registroId)
      .order('fecha_modificacion', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Obtener estadísticas de asistencia
   */
  async getEstadisticas(mes: number, anio: number, obraId: number) {
    const registros = await this.getByObraYMes(obraId, mes, anio)

    const totalRegistros = registros.length
    const porEstado = {
      OK: registros.filter(r => r.estado === 'OK').length,
      F: registros.filter(r => r.estado === 'F').length,
      J: registros.filter(r => r.estado === 'J').length,
      A: registros.filter(r => r.estado === 'A').length,
      L: registros.filter(r => r.estado === 'L').length,
      BT: registros.filter(r => r.estado === 'BT').length,
      BTR: registros.filter(r => r.estado === 'BTR').length,
      R: registros.filter(r => r.estado === 'R').length
    }

    const totalHorasTrabajadas = registros.reduce((sum, r) => sum + (r.horas_trabajadas || 0), 0)
    const totalHE50 = registros.reduce((sum, r) => sum + (r.horas_extras_50 || 0), 0)
    const totalHE100 = registros.reduce((sum, r) => sum + (r.horas_extras_100 || 0), 0)

    const promedioAsistencia = totalRegistros > 0 ? (porEstado.OK / totalRegistros) * 100 : 0

    return {
      totalRegistros,
      porEstado,
      horas: {
        totalHorasTrabajadas,
        totalHE50,
        totalHE100,
        promedioHorasDiarias: porEstado.OK > 0 ? totalHorasTrabajadas / porEstado.OK : 0
      },
      promedioAsistencia: Math.round(promedioAsistencia * 100) / 100
    }
  }
}

/**
 * Utilidades
 */
export const asistenciaUtils = {
  /**
   * Obtener color para cada estado
   */
  getColorEstado(estado: EstadoAsistencia | ''): string {
    const colores: Record<string, string> = {
      'OK': '#98FB98',      // Verde claro
      'F': '#FFB6C1',       // Rosado claro
      'J': '#B0E0E6',       // Celeste pálido
      'A': '#FFA07A',       // Salmón claro
      'L': '#FFFACD',       // Amarillo pálido
      'BT': '#E6B0AA',      // Rosado pastel
      'BTR': '#FAE5D3',     // Beige claro
      'R': '#D3D3D3'        // Gris claro
    }
    return colores[estado] || '#FFFFFF'
  },

  /**
   * Obtener etiqueta legible del estado
   */
  getEtiquetaEstado(estado: EstadoAsistencia): string {
    const etiquetas: Record<EstadoAsistencia, string> = {
      'OK': 'Asistencia',
      'F': 'Falta',
      'J': 'Justificativo',
      'A': 'Accidente Laboral',
      'L': 'Licencia',
      'BT': 'Bajada Tomada',
      'BTR': 'Bajada Trabajada',
      'R': 'Renuncia'
    }
    return etiquetas[estado]
  },

  /**
   * Verificar si una fecha es fin de semana
   */
  esFinDeSemana(fecha: string): boolean {
    const dia = new Date(fecha).getDay()
    return dia === 0 || dia === 6 // Domingo o Sábado
  },

  /**
   * Obtener nombre del mes
   */
  getNombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return meses[mes - 1] || ''
  },

  /**
   * Convertir Date a string YYYY-MM-DD sin problemas de timezone
   * Evita el desfase de 1 día que ocurre con toISOString() en zonas UTC negativas
   */
  formatFechaLocal(fecha: Date): string {
    const año = fecha.getFullYear()
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
    const dia = fecha.getDate().toString().padStart(2, '0')
    return `${año}-${mes}-${dia}`
  }
}

export default asistenciaService
