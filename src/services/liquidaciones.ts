/**
 * Servicio para gestión de Liquidaciones de Sueldo
 * Maneja operaciones CRUD y cálculos de liquidaciones mensuales
 */

import { supabase } from '@/lib/supabase'

export interface Liquidacion {
  id?: number
  trabajador_id: number
  contrato_id: number

  // Periodo
  periodo_mes: number
  periodo_anio: number

  // Haberes
  salario_base: number
  horas_extras?: number
  bono_produccion?: number
  bono_asistencia?: number
  colacion?: number
  movilizacion?: number
  otros_haberes?: number
  otros_haberes_detalle?: string
  total_haberes: number

  // Descuentos
  afp_porcentaje?: number
  afp_monto?: number
  salud_porcentaje?: number
  salud_monto?: number
  seguro_cesantia?: number
  impuesto_unico?: number
  anticipos?: number
  prestamos?: number
  otros_descuentos?: number
  otros_descuentos_detalle?: string
  total_descuentos: number

  // Líquido
  liquido_pagar: number

  // Metadata
  dias_trabajados?: number
  dias_licencia?: number
  dias_vacaciones?: number
  dias_ausencia?: number

  // Estado
  estado: 'borrador' | 'calculada' | 'aprobada' | 'pagada' | 'anulada'

  // Documentos
  pdf_url?: string

  // Pago
  fecha_pago?: string
  metodo_pago?: 'transferencia' | 'efectivo' | 'cheque'
  comprobante_pago?: string

  // Auditoría
  generado_por?: number
  aprobado_por?: number
  pagado_por?: number
  fecha_aprobacion?: string
  fecha_generacion?: string
  notas?: string
  created_at?: string
  updated_at?: string
}

export interface LiquidacionConTrabajador extends Liquidacion {
  trabajador_nombre: string
  trabajador_rut: string
  trabajador_cargo: string
}

export interface CreateLiquidacionDTO {
  trabajador_id: number
  contrato_id: number
  periodo_mes: number
  periodo_anio: number
  salario_base: number
  horas_extras?: number
  bono_produccion?: number
  bono_asistencia?: number
  colacion?: number
  movilizacion?: number
  otros_haberes?: number
  otros_haberes_detalle?: string
  dias_trabajados?: number
  dias_licencia?: number
  dias_vacaciones?: number
  dias_ausencia?: number
}

/**
 * Servicio de Liquidaciones
 */
export const liquidacionesService = {
  /**
   * Obtener todas las liquidaciones
   */
  async getAll(): Promise<Liquidacion[]> {
    const { data, error } = await supabase
      .from('liquidaciones')
      .select('*')
      .order('periodo_anio', { ascending: false })
      .order('periodo_mes', { ascending: false })

    if (error) {
      console.error('Error al obtener liquidaciones:', error)
      throw error
    }

    return data || []
  },

  /**
   * Obtener liquidación por ID
   */
  async getById(id: number): Promise<Liquidacion | null> {
    const { data, error } = await supabase
      .from('liquidaciones')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error al obtener liquidación:', error)
      throw error
    }

    return data
  },

  /**
   * Obtener liquidaciones de un trabajador
   */
  async getByTrabajador(trabajadorId: number): Promise<Liquidacion[]> {
    const { data, error } = await supabase
      .from('liquidaciones')
      .select('*')
      .eq('trabajador_id', trabajadorId)
      .order('periodo_anio', { ascending: false })
      .order('periodo_mes', { ascending: false })

    if (error) {
      console.error('Error al obtener liquidaciones del trabajador:', error)
      throw error
    }

    return data || []
  },

  /**
   * Obtener liquidaciones de un periodo
   */
  async getByPeriodo(mes: number, anio: number): Promise<Liquidacion[]> {
    const { data, error } = await supabase
      .from('liquidaciones')
      .select('*')
      .eq('periodo_mes', mes)
      .eq('periodo_anio', anio)

    if (error) {
      console.error('Error al obtener liquidaciones del periodo:', error)
      throw error
    }

    return data || []
  },

  /**
   * Crear liquidación con cálculos automáticos
   */
  async crear(dto: CreateLiquidacionDTO, generadoPor?: number): Promise<Liquidacion> {
    // Validar que no exista liquidación para ese periodo
    const { data: existente } = await supabase
      .from('liquidaciones')
      .select('id')
      .eq('trabajador_id', dto.trabajador_id)
      .eq('periodo_mes', dto.periodo_mes)
      .eq('periodo_anio', dto.periodo_anio)
      .single()

    if (existente) {
      throw new Error('Ya existe una liquidación para este trabajador en este periodo')
    }

    // Calcular haberes
    const totalHaberes =
      dto.salario_base +
      (dto.horas_extras || 0) +
      (dto.bono_produccion || 0) +
      (dto.bono_asistencia || 0) +
      (dto.colacion || 0) +
      (dto.movilizacion || 0) +
      (dto.otros_haberes || 0)

    // Calcular descuentos (llamar a funciones de BD)
    const salarioImponible = dto.salario_base + (dto.horas_extras || 0)

    const { data: afpMonto } = await supabase.rpc('calcular_afp', {
      salario_imponible: salarioImponible
    })

    const { data: saludMonto } = await supabase.rpc('calcular_salud', {
      salario_imponible: salarioImponible,
      porcentaje: 7 // Fonasa por defecto
    })

    const { data: cesantiaMonto } = await supabase.rpc('calcular_seguro_cesantia_trabajador', {
      salario_imponible: salarioImponible
    })

    const totalDescuentos =
      (afpMonto || 0) +
      (saludMonto || 0) +
      (cesantiaMonto || 0) +
      (dto.anticipos || 0) +
      (dto.prestamos || 0)

    const liquidoPagar = totalHaberes - totalDescuentos

    const liquidacion = {
      ...dto,
      total_haberes: totalHaberes,
      afp_porcentaje: 10,
      afp_monto: afpMonto || 0,
      salud_porcentaje: 7,
      salud_monto: saludMonto || 0,
      seguro_cesantia: cesantiaMonto || 0,
      total_descuentos: totalDescuentos,
      liquido_pagar: liquidoPagar,
      estado: 'borrador' as const,
      generado_por: generadoPor
    }

    const { data, error } = await supabase
      .from('liquidaciones')
      .insert([liquidacion])
      .select()
      .single()

    if (error) {
      console.error('Error al crear liquidación:', error)
      throw error
    }

    return data
  },

  /**
   * Actualizar liquidación
   */
  async actualizar(id: number, updates: Partial<Liquidacion>): Promise<Liquidacion> {
    const { data, error } = await supabase
      .from('liquidaciones')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar liquidación:', error)
      throw error
    }

    return data
  },

  /**
   * Recalcular totales de liquidación
   */
  async recalcular(id: number): Promise<void> {
    const { error } = await supabase.rpc('calcular_totales_liquidacion', {
      liquidacion_id: id
    })

    if (error) {
      console.error('Error al recalcular liquidación:', error)
      throw error
    }
  },

  /**
   * Aprobar liquidación
   */
  async aprobar(id: number, aprobadoPor: number): Promise<Liquidacion> {
    const { data, error } = await supabase
      .from('liquidaciones')
      .update({
        estado: 'aprobada',
        aprobado_por: aprobadoPor,
        fecha_aprobacion: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error al aprobar liquidación:', error)
      throw error
    }

    return data
  },

  /**
   * Marcar como pagada
   */
  async marcarPagada(
    id: number,
    metodoPago: 'transferencia' | 'efectivo' | 'cheque',
    pagadoPor: number,
    comprobante?: string
  ): Promise<Liquidacion> {
    const { data, error } = await supabase
      .from('liquidaciones')
      .update({
        estado: 'pagada',
        metodo_pago: metodoPago,
        fecha_pago: new Date().toISOString().split('T')[0],
        pagado_por: pagadoPor,
        comprobante_pago: comprobante
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error al marcar liquidación como pagada:', error)
      throw error
    }

    return data
  },

  /**
   * Anular liquidación
   */
  async anular(id: number, motivo?: string): Promise<Liquidacion> {
    const { data, error } = await supabase
      .from('liquidaciones')
      .update({
        estado: 'anulada',
        notas: motivo
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error al anular liquidación:', error)
      throw error
    }

    return data
  },

  /**
   * Generar liquidaciones masivas para un periodo
   */
  async generarMasiva(
    mes: number,
    anio: number,
    trabajadoresIds: number[],
    generadoPor?: number
  ): Promise<{ exitosos: number; errores: string[] }> {
    const errores: string[] = []
    let exitosos = 0

    for (const trabajadorId of trabajadoresIds) {
      try {
        // Obtener trabajador y contrato activo
        const { data: trabajador } = await supabase
          .from('trabajadores')
          .select('*, contratos!inner(*)')
          .eq('id', trabajadorId)
          .eq('contratos.activo', true)
          .single()

        if (!trabajador || !trabajador.contratos || trabajador.contratos.length === 0) {
          errores.push(`Trabajador ${trabajadorId}: No tiene contrato activo`)
          continue
        }

        const contrato = trabajador.contratos[0]

        await this.crear(
          {
            trabajador_id: trabajadorId,
            contrato_id: contrato.id,
            periodo_mes: mes,
            periodo_anio: anio,
            salario_base: contrato.salario_base,
            colacion: trabajador.asignacion_colacion || 0,
            movilizacion: trabajador.asignacion_movilizacion || 0,
            dias_trabajados: 30
          },
          generadoPor
        )

        exitosos++
      } catch (error) {
        errores.push(`Trabajador ${trabajadorId}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    return { exitosos, errores }
  },

  /**
   * Obtener estadísticas de liquidaciones
   */
  async getEstadisticas(mes: number, anio: number) {
    const liquidaciones = await this.getByPeriodo(mes, anio)

    const totalLiquidaciones = liquidaciones.length
    const porEstado = {
      borrador: liquidaciones.filter(l => l.estado === 'borrador').length,
      calculada: liquidaciones.filter(l => l.estado === 'calculada').length,
      aprobada: liquidaciones.filter(l => l.estado === 'aprobada').length,
      pagada: liquidaciones.filter(l => l.estado === 'pagada').length,
      anulada: liquidaciones.filter(l => l.estado === 'anulada').length
    }

    const totalHaberes = liquidaciones.reduce((sum, l) => sum + l.total_haberes, 0)
    const totalDescuentos = liquidaciones.reduce((sum, l) => sum + l.total_descuentos, 0)
    const totalLiquido = liquidaciones.reduce((sum, l) => sum + l.liquido_pagar, 0)

    return {
      totalLiquidaciones,
      porEstado,
      montos: {
        totalHaberes,
        totalDescuentos,
        totalLiquido
      }
    }
  }
}

export default liquidacionesService
