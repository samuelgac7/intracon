import { supabase, type DocumentoTrabajador, type DocumentoObligatorioConfig } from '@/lib/supabase'

/**
 * Resultado del cálculo de cumplimiento documental de un trabajador
 */
export interface CumplimientoDocumental {
  trabajadorId: number
  totalObligatorios: number
  completados: number
  pendientes: number
  vencidos: number
  porVencer: number
  rechazados: number
  porcentaje: number
  documentosFaltantes: Array<{
    codigo: string
    nombre: string
    categoria: string
  }>
  documentosVencidos: Array<{
    codigo: string
    nombre: string
    fechaVencimiento: string
  }>
  documentosPorVencer: Array<{
    codigo: string
    nombre: string
    fechaVencimiento: string
    diasRestantes: number
  }>
}

/**
 * Resultado agregado de cumplimiento documental para una obra
 */
export interface CumplimientoObraDocumental {
  obraId: number
  totalTrabajadores: number
  trabajadoresAlDia: number
  trabajadoresPendientes: number
  trabajadoresCriticos: number // con documentos vencidos o rechazados
  porcentajeGeneral: number
  documentosVencidosTotal: number
  documentosPorVencerTotal: number
}

/**
 * Servicio para gestión de documentos obligatorios y cálculo de cumplimiento
 */
export const documentosService = {
  /**
   * Obtiene la configuración de todos los documentos obligatorios activos
   */
  async getDocumentosObligatorios(): Promise<DocumentoObligatorioConfig[]> {
    const { data, error } = await supabase
      .from('documentos_obligatorios_config')
      .select('*')
      .eq('activo', true)
      .order('orden_visualizacion', { ascending: true })

    if (error) throw error
    return data as DocumentoObligatorioConfig[]
  },

  /**
   * Obtiene los documentos de un trabajador específico
   */
  async getDocumentosTrabajador(trabajadorId: number): Promise<DocumentoTrabajador[]> {
    const { data, error } = await supabase
      .from('documentos_trabajador')
      .select('*')
      .eq('trabajador_id', trabajadorId)
      .order('fecha_subida', { ascending: false })

    if (error) throw error
    return data as DocumentoTrabajador[]
  },

  /**
   * Calcula el cumplimiento documental de un trabajador (versión en memoria)
   *
   * Esta función NO hace queries a la base de datos, solo procesa datos ya cargados
   * Útil para optimizar cuando se calculan muchos trabajadores a la vez
   */
  calcularCumplimientoTrabajadorEnMemoria(
    trabajadorId: number,
    docsTrabajador: DocumentoTrabajador[],
    docsObligatorios: DocumentoObligatorioConfig[]
  ): CumplimientoDocumental {
    // 1. Crear mapa de documentos del trabajador por código
    const mapaDocsTrabajador = new Map<string, DocumentoTrabajador>()

    // Para cada tipo de documento, guardar el más reciente
    for (const doc of docsTrabajador) {
      const codigoDoc = doc.tipo
      const existente = mapaDocsTrabajador.get(codigoDoc)

      if (!existente || new Date(doc.fecha_subida) > new Date(existente.fecha_subida)) {
        mapaDocsTrabajador.set(codigoDoc, doc)
      }
    }

    // 2. Aplicar lógica condicional para anexos
    const documentosAplicables = docsObligatorios.filter(config => {
      if (config.codigo === 'anexo_plazo') {
        const contrato = mapaDocsTrabajador.get('contrato')
        if (!contrato) return false
        return true
      }

      if (config.codigo === 'anexo_obra') {
        return false
      }

      if (config.codigo === 'finiquito') {
        return false
      }

      return true
    })

    // 3. Calcular métricas
    let completados = 0
    let pendientes = 0
    let vencidos = 0
    let porVencer = 0
    let rechazados = 0
    const documentosFaltantes: Array<{ codigo: string; nombre: string; categoria: string }> = []
    const documentosVencidos: Array<{ codigo: string; nombre: string; fechaVencimiento: string }> = []
    const documentosPorVencer: Array<{ codigo: string; nombre: string; fechaVencimiento: string; diasRestantes: number }> = []

    const hoy = new Date()
    const treintaDiasAdelante = new Date()
    treintaDiasAdelante.setDate(hoy.getDate() + 30)

    for (const config of documentosAplicables) {
      const doc = mapaDocsTrabajador.get(config.codigo)

      if (!doc) {
        pendientes++
        documentosFaltantes.push({
          codigo: config.codigo,
          nombre: config.nombre,
          categoria: config.categoria
        })
      } else {
        switch (doc.estado_validacion) {
          case 'vigente':
            if (doc.fecha_vencimiento && config.tiene_vencimiento) {
              const fechaVenc = new Date(doc.fecha_vencimiento)

              if (fechaVenc < hoy) {
                vencidos++
                documentosVencidos.push({
                  codigo: config.codigo,
                  nombre: config.nombre,
                  fechaVencimiento: doc.fecha_vencimiento
                })
              } else if (fechaVenc <= treintaDiasAdelante) {
                porVencer++
                const diasRestantes = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                documentosPorVencer.push({
                  codigo: config.codigo,
                  nombre: config.nombre,
                  fechaVencimiento: doc.fecha_vencimiento,
                  diasRestantes
                })
              }
            }

            if (config.requiere_firma && !doc.firmado) {
              pendientes++
            } else {
              completados++
            }
            break

          case 'vencido':
            vencidos++
            if (doc.fecha_vencimiento) {
              documentosVencidos.push({
                codigo: config.codigo,
                nombre: config.nombre,
                fechaVencimiento: doc.fecha_vencimiento
              })
            }
            break

          case 'por_vencer':
            porVencer++
            if (doc.fecha_vencimiento) {
              const fechaVenc = new Date(doc.fecha_vencimiento)
              const diasRestantes = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
              documentosPorVencer.push({
                codigo: config.codigo,
                nombre: config.nombre,
                fechaVencimiento: doc.fecha_vencimiento,
                diasRestantes
              })
            }
            break

          case 'rechazado':
            rechazados++
            documentosFaltantes.push({
              codigo: config.codigo,
              nombre: config.nombre,
              categoria: config.categoria
            })
            break

          case 'pendiente':
          default:
            pendientes++
            break
        }
      }
    }

    const totalObligatorios = documentosAplicables.length
    const porcentaje = totalObligatorios > 0 ? Math.round((completados / totalObligatorios) * 100) : 0

    return {
      trabajadorId,
      totalObligatorios,
      completados,
      pendientes,
      vencidos,
      porVencer,
      rechazados,
      porcentaje,
      documentosFaltantes,
      documentosVencidos,
      documentosPorVencer
    }
  },

  /**
   * Calcula el cumplimiento documental de un trabajador
   *
   * Considera:
   * - Documentos obligatorios según configuración
   * - Estado de validación (vigente, vencido, pendiente, rechazado)
   * - Documentos próximos a vencer (30 días por defecto)
   * - Lógica condicional para anexos (solo si aplica)
   */
  async calcularCumplimientoTrabajador(trabajadorId: number): Promise<CumplimientoDocumental> {
    // 1. Obtener configuración de documentos obligatorios
    const docsObligatorios = await this.getDocumentosObligatorios()

    // 2. Obtener documentos actuales del trabajador
    const docsTrabajador = await this.getDocumentosTrabajador(trabajadorId)

    // 3. Delegar a la versión en memoria (evita duplicar lógica)
    return this.calcularCumplimientoTrabajadorEnMemoria(trabajadorId, docsTrabajador, docsObligatorios)
  },

  /**
   * Calcula el cumplimiento documental de VARIAS obras en una sola pasada
   * ULTRA-OPTIMIZADO: Hace batch queries para múltiples obras a la vez
   */
  async calcularCumplimientoVariasObras(obrasIds: number[]): Promise<Map<number, CumplimientoObraDocumental>> {
    if (obrasIds.length === 0) {
      return new Map()
    }

    // 1. Obtener TODAS las asignaciones de TODAS las obras en una sola query
    const { data: todasAsignaciones, error: asignError } = await supabase
      .from('trabajadores_obras')
      .select('obra_id, trabajador_id')
      .in('obra_id', obrasIds)
      .eq('activo', true)

    if (asignError) throw asignError

    // Agrupar asignaciones por obra
    const asignacionesPorObra = new Map<number, number[]>()
    for (const asignacion of (todasAsignaciones || [])) {
      if (!asignacionesPorObra.has(asignacion.obra_id)) {
        asignacionesPorObra.set(asignacion.obra_id, [])
      }
      asignacionesPorObra.get(asignacion.obra_id)!.push(asignacion.trabajador_id)
    }

    // Obtener todos los trabajadores únicos
    const todosLosTrabajadoresIds = Array.from(
      new Set(todasAsignaciones?.map(a => a.trabajador_id) || [])
    )

    if (todosLosTrabajadoresIds.length === 0) {
      // Crear resultados vacíos para todas las obras
      const resultados = new Map<number, CumplimientoObraDocumental>()
      for (const obraId of obrasIds) {
        resultados.set(obraId, {
          obraId,
          totalTrabajadores: 0,
          trabajadoresAlDia: 0,
          trabajadoresPendientes: 0,
          trabajadoresCriticos: 0,
          porcentajeGeneral: 0,
          documentosVencidosTotal: 0,
          documentosPorVencerTotal: 0
        })
      }
      return resultados
    }

    // 2. Obtener TODOS los documentos de TODOS los trabajadores en UNA sola query
    const { data: todosLosDocumentos, error: docsError } = await supabase
      .from('documentos_trabajador')
      .select('*')
      .in('trabajador_id', todosLosTrabajadoresIds)

    if (docsError) throw docsError

    // Agrupar documentos por trabajador_id
    const documentosPorTrabajador = new Map<number, DocumentoTrabajador[]>()
    for (const doc of (todosLosDocumentos || [])) {
      if (!documentosPorTrabajador.has(doc.trabajador_id)) {
        documentosPorTrabajador.set(doc.trabajador_id, [])
      }
      documentosPorTrabajador.get(doc.trabajador_id)!.push(doc)
    }

    // 3. Obtener configuración de documentos obligatorios (una sola vez)
    const docsObligatorios = await this.getDocumentosObligatorios()

    // 4. Calcular cumplimiento por trabajador (en memoria, todos a la vez)
    const cumplimientosPorTrabajador = new Map<number, CumplimientoDocumental>()
    for (const trabajadorId of todosLosTrabajadoresIds) {
      const docsTrabajador = documentosPorTrabajador.get(trabajadorId) || []
      const cumplimiento = this.calcularCumplimientoTrabajadorEnMemoria(
        trabajadorId,
        docsTrabajador,
        docsObligatorios
      )
      cumplimientosPorTrabajador.set(trabajadorId, cumplimiento)
    }

    // 5. Agregar resultados por obra
    const resultados = new Map<number, CumplimientoObraDocumental>()

    for (const obraId of obrasIds) {
      const trabajadoresDeObra = asignacionesPorObra.get(obraId) || []
      const totalTrabajadores = trabajadoresDeObra.length

      if (totalTrabajadores === 0) {
        resultados.set(obraId, {
          obraId,
          totalTrabajadores: 0,
          trabajadoresAlDia: 0,
          trabajadoresPendientes: 0,
          trabajadoresCriticos: 0,
          porcentajeGeneral: 0,
          documentosVencidosTotal: 0,
          documentosPorVencerTotal: 0
        })
        continue
      }

      let trabajadoresAlDia = 0
      let trabajadoresPendientes = 0
      let trabajadoresCriticos = 0
      let sumaPorcentajes = 0
      let documentosVencidosTotal = 0
      let documentosPorVencerTotal = 0

      for (const trabajadorId of trabajadoresDeObra) {
        const cumplimiento = cumplimientosPorTrabajador.get(trabajadorId)
        if (!cumplimiento) continue

        sumaPorcentajes += cumplimiento.porcentaje

        if (cumplimiento.porcentaje === 100) {
          trabajadoresAlDia++
        } else if (cumplimiento.vencidos > 0 || cumplimiento.rechazados > 0) {
          trabajadoresCriticos++
        } else {
          trabajadoresPendientes++
        }

        documentosVencidosTotal += cumplimiento.vencidos
        documentosPorVencerTotal += cumplimiento.porVencer
      }

      const porcentajeGeneral = totalTrabajadores > 0
        ? Math.round(sumaPorcentajes / totalTrabajadores)
        : 0

      resultados.set(obraId, {
        obraId,
        totalTrabajadores,
        trabajadoresAlDia,
        trabajadoresPendientes,
        trabajadoresCriticos,
        porcentajeGeneral,
        documentosVencidosTotal,
        documentosPorVencerTotal
      })
    }

    return resultados
  },

  /**
   * Calcula el cumplimiento documental agregado de una obra
   *
   * Analiza todos los trabajadores activos asignados a la obra
   * y genera métricas consolidadas.
   * OPTIMIZADO: Hace batch queries en lugar de queries individuales por trabajador
   */
  async calcularCumplimientoObra(obraId: number): Promise<CumplimientoObraDocumental> {
    // 1. Obtener trabajadores activos de la obra
    const { data: asignaciones, error } = await supabase
      .from('trabajadores_obras')
      .select('trabajador_id')
      .eq('obra_id', obraId)
      .eq('activo', true)

    if (error) throw error

    const trabajadoresIds = asignaciones?.map(a => a.trabajador_id) || []
    const totalTrabajadores = trabajadoresIds.length

    if (totalTrabajadores === 0) {
      return {
        obraId,
        totalTrabajadores: 0,
        trabajadoresAlDia: 0,
        trabajadoresPendientes: 0,
        trabajadoresCriticos: 0,
        porcentajeGeneral: 0,
        documentosVencidosTotal: 0,
        documentosPorVencerTotal: 0
      }
    }

    // 2. OPTIMIZACIÓN: Obtener TODOS los documentos de TODOS los trabajadores en una sola query
    const { data: todosLosDocumentos, error: docsError } = await supabase
      .from('documentos_trabajador')
      .select('*')
      .in('trabajador_id', trabajadoresIds)

    if (docsError) throw docsError

    // Agrupar documentos por trabajador_id
    const documentosPorTrabajador = new Map<number, DocumentoTrabajador[]>()
    for (const doc of (todosLosDocumentos || [])) {
      if (!documentosPorTrabajador.has(doc.trabajador_id)) {
        documentosPorTrabajador.set(doc.trabajador_id, [])
      }
      documentosPorTrabajador.get(doc.trabajador_id)!.push(doc)
    }

    // 3. Obtener configuración de documentos obligatorios (una sola vez)
    const docsObligatorios = await this.getDocumentosObligatorios()

    // 4. Calcular cumplimiento de cada trabajador usando datos en memoria
    const cumplimientos: CumplimientoDocumental[] = []
    for (const trabajadorId of trabajadoresIds) {
      const docsTrabajador = documentosPorTrabajador.get(trabajadorId) || []
      const cumplimiento = this.calcularCumplimientoTrabajadorEnMemoria(
        trabajadorId,
        docsTrabajador,
        docsObligatorios
      )
      cumplimientos.push(cumplimiento)
    }

    // 5. Agregar resultados
    let trabajadoresAlDia = 0
    let trabajadoresPendientes = 0
    let trabajadoresCriticos = 0
    let sumaPorcentajes = 0
    let documentosVencidosTotal = 0
    let documentosPorVencerTotal = 0

    for (const cumplimiento of cumplimientos) {
      sumaPorcentajes += cumplimiento.porcentaje

      if (cumplimiento.porcentaje === 100) {
        trabajadoresAlDia++
      } else if (cumplimiento.vencidos > 0 || cumplimiento.rechazados > 0) {
        trabajadoresCriticos++
      } else {
        trabajadoresPendientes++
      }

      documentosVencidosTotal += cumplimiento.vencidos
      documentosPorVencerTotal += cumplimiento.porVencer
    }

    const porcentajeGeneral = totalTrabajadores > 0
      ? Math.round(sumaPorcentajes / totalTrabajadores)
      : 0

    return {
      obraId,
      totalTrabajadores,
      trabajadoresAlDia,
      trabajadoresPendientes,
      trabajadoresCriticos,
      porcentajeGeneral,
      documentosVencidosTotal,
      documentosPorVencerTotal
    }
  },

  /**
   * Actualiza el estado de validación de un documento
   */
  async actualizarEstadoDocumento(
    documentoId: number,
    nuevoEstado: 'pendiente' | 'vigente' | 'por_vencer' | 'vencido' | 'rechazado',
    validadoPor?: number,
    motivoRechazo?: string
  ): Promise<DocumentoTrabajador> {
    const updates: Partial<DocumentoTrabajador> = {
      estado_validacion: nuevoEstado,
      validado_por: validadoPor,
      fecha_validacion: new Date().toISOString(),
      motivo_rechazo: motivoRechazo
    }

    const { data, error } = await supabase
      .from('documentos_trabajador')
      .update(updates)
      .eq('id', documentoId)
      .select()
      .single()

    if (error) throw error
    return data as DocumentoTrabajador
  },

  /**
   * Marca un documento como firmado
   */
  async marcarComoFirmado(documentoId: number): Promise<DocumentoTrabajador> {
    const { data, error } = await supabase
      .from('documentos_trabajador')
      .update({
        firmado: true,
        fecha_firma: new Date().toISOString()
      })
      .eq('id', documentoId)
      .select()
      .single()

    if (error) throw error
    return data as DocumentoTrabajador
  },

  /**
   * Obtiene estadísticas globales de cumplimiento documental de toda la empresa
   * Útil para dashboard de gerencia
   * OPTIMIZADO: Hace batch queries en lugar de queries individuales por trabajador
   */
  async getEstadisticasGlobales(): Promise<{
    totalTrabajadores: number
    trabajadoresAlDia: number
    trabajadoresPendientes: number
    trabajadoresCriticos: number
    porcentajeGeneral: number
    documentosVencidosTotal: number
    documentosPorVencerTotal: number
  }> {
    // 1. Obtener todos los trabajadores activos
    const { data: trabajadores, error } = await supabase
      .from('trabajadores')
      .select('id')
      .eq('estado', 'activo')

    if (error) throw error

    const trabajadoresIds = trabajadores?.map(t => t.id) || []
    const totalTrabajadores = trabajadoresIds.length

    if (totalTrabajadores === 0) {
      return {
        totalTrabajadores: 0,
        trabajadoresAlDia: 0,
        trabajadoresPendientes: 0,
        trabajadoresCriticos: 0,
        porcentajeGeneral: 0,
        documentosVencidosTotal: 0,
        documentosPorVencerTotal: 0
      }
    }

    // 2. OPTIMIZACIÓN: Obtener TODOS los documentos de TODOS los trabajadores en una sola query
    const { data: todosLosDocumentos, error: docsError } = await supabase
      .from('documentos_trabajador')
      .select('*')
      .in('trabajador_id', trabajadoresIds)

    if (docsError) throw docsError

    // Agrupar documentos por trabajador_id
    const documentosPorTrabajador = new Map<number, DocumentoTrabajador[]>()
    for (const doc of (todosLosDocumentos || [])) {
      if (!documentosPorTrabajador.has(doc.trabajador_id)) {
        documentosPorTrabajador.set(doc.trabajador_id, [])
      }
      documentosPorTrabajador.get(doc.trabajador_id)!.push(doc)
    }

    // 3. Obtener configuración de documentos obligatorios (una sola vez)
    const docsObligatorios = await this.getDocumentosObligatorios()

    // 4. Calcular cumplimiento de cada trabajador usando datos en memoria
    const cumplimientos: CumplimientoDocumental[] = []
    for (const trabajadorId of trabajadoresIds) {
      const docsTrabajador = documentosPorTrabajador.get(trabajadorId) || []
      const cumplimiento = this.calcularCumplimientoTrabajadorEnMemoria(
        trabajadorId,
        docsTrabajador,
        docsObligatorios
      )
      cumplimientos.push(cumplimiento)
    }

    // 5. Agregar resultados
    let trabajadoresAlDia = 0
    let trabajadoresPendientes = 0
    let trabajadoresCriticos = 0
    let sumaPorcentajes = 0
    let documentosVencidosTotal = 0
    let documentosPorVencerTotal = 0

    for (const cumplimiento of cumplimientos) {
      sumaPorcentajes += cumplimiento.porcentaje

      if (cumplimiento.porcentaje === 100) {
        trabajadoresAlDia++
      } else if (cumplimiento.vencidos > 0 || cumplimiento.rechazados > 0) {
        trabajadoresCriticos++
      } else {
        trabajadoresPendientes++
      }

      documentosVencidosTotal += cumplimiento.vencidos
      documentosPorVencerTotal += cumplimiento.porVencer
    }

    const porcentajeGeneral = totalTrabajadores > 0
      ? Math.round(sumaPorcentajes / totalTrabajadores)
      : 0

    return {
      totalTrabajadores,
      trabajadoresAlDia,
      trabajadoresPendientes,
      trabajadoresCriticos,
      porcentajeGeneral,
      documentosVencidosTotal,
      documentosPorVencerTotal
    }
  }
}
