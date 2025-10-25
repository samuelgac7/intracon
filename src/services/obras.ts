import { supabase, type Obra, type AsignacionTrabajador } from '@/lib/supabase'

/**
 * Servicio para la gestión de obras en el sistema Intranet Tecnycon
 *
 * Proporciona operaciones CRUD completas para obras, gestión de trabajadores asignados,
 * y consultas filtradas para el módulo de obras.
 *
 * @module obrasService
 */
export const obrasService = {
  /**
   * Obtiene todas las obras del sistema ordenadas por fecha de inicio descendente
   *
   * @returns {Promise<Obra[]>} Array de todas las obras
   * @throws {Error} Si ocurre un error en la consulta a Supabase
   *
   * @example
   * const obras = await obrasService.getAll()
   * console.log(`Total de obras: ${obras.length}`)
   */
  async getAll() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const response = await fetch(`${supabaseUrl}/rest/v1/obras?select=*&order=fecha_inicio.desc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) throw new Error('Error obteniendo obras')
    return await response.json() as Obra[]
  },

  /**
   * Obtiene una obra específica por su ID
   *
   * @param {number} id - ID único de la obra
   * @returns {Promise<Obra>} Datos completos de la obra
   * @throws {Error} Si la obra no existe o hay un error en la consulta
   *
   * @example
   * const obra = await obrasService.getById(123)
   * console.log(`Obra: ${obra.nombre}`)
   */
  async getById(id: number) {
    const { data, error } = await supabase
      .from('obras')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Obra
  },

  /**
   * Crea una nueva obra en el sistema
   *
   * @param {Omit<Obra, 'id' | 'fecha_creacion' | 'ultima_actualizacion'>} obra - Datos de la obra a crear
   * @returns {Promise<Obra>} Obra creada con ID generado automáticamente
   * @throws {Error} Si hay un error en la inserción o validación de datos
   *
   * @example
   * const nuevaObra = await obrasService.create({
   *   nombre: "Edificio Central",
   *   ubicacion: "Santiago Centro",
   *   cliente: "Constructora ABC",
   *   estado: "planificacion",
   *   presupuesto: "500000000",
   *   fecha_inicio: "2025-01-15",
   *   progreso: 0
   * })
   */
  async create(obra: Omit<Obra, 'id' | 'fecha_creacion' | 'ultima_actualizacion'>) {
    const { data, error } = await supabase
      .from('obras')
      .insert([obra])
      .select()
      .single()

    if (error) throw error
    return data as Obra
  },

  /**
   * Actualiza los datos de una obra existente
   *
   * @param {number} id - ID de la obra a actualizar
   * @param {Partial<Obra>} updates - Campos a actualizar (solo los modificados)
   * @returns {Promise<Obra>} Obra actualizada con los nuevos valores
   * @throws {Error} Si la obra no existe o hay un error en la actualización
   *
   * @example
   * const obraActualizada = await obrasService.update(123, {
   *   progreso: 45,
   *   estado: "en-curso"
   * })
   */
  async update(id: number, updates: Partial<Obra>) {
    const { data, error } = await supabase
      .from('obras')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Obra
  },

  /**
   * Elimina una obra del sistema
   *
   * PRECAUCIÓN: Esta operación es irreversible. Se recomienda validar
   * que no existan trabajadores asignados o dependencias críticas antes de eliminar.
   *
   * @param {number} id - ID de la obra a eliminar
   * @returns {Promise<boolean>} true si la eliminación fue exitosa
   * @throws {Error} Si hay un error en la eliminación (ej: restricciones de FK)
   *
   * @example
   * await obrasService.delete(123)
   */
  async delete(id: number) {
    const { error } = await supabase
      .from('obras')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  /**
   * Filtra obras por múltiples criterios
   *
   * Permite búsqueda por estado y/o texto libre en nombre, ubicación y cliente.
   * Los filtros son opcionales y se combinan con lógica AND.
   *
   * @param {Object} filters - Objeto con criterios de filtrado
   * @param {string} [filters.estado] - Estado de la obra (planificacion, en-curso, pausada, finalizada)
   * @param {string} [filters.search] - Término de búsqueda en nombre, ubicación o cliente
   * @returns {Promise<Obra[]>} Array de obras que cumplen los criterios
   * @throws {Error} Si hay un error en la consulta
   *
   * @example
   * const obrasEnCurso = await obrasService.filter({ estado: "en-curso" })
   * const obrasSantiago = await obrasService.filter({ search: "Santiago" })
   * const obrasFiltradas = await obrasService.filter({
   *   estado: "en-curso",
   *   search: "Central"
   * })
   */
  async filter(filters: {
    estado?: string
    search?: string
  }) {
    let query = supabase.from('obras').select('*')

    if (filters.estado) {
      query = query.eq('estado', filters.estado)
    }

    if (filters.search) {
      query = query.or(`nombre.ilike.%${filters.search}%,ubicacion.ilike.%${filters.search}%,cliente.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order('fecha_inicio', { ascending: false })

    if (error) throw error
    return data as Obra[]
  },

  /**
   * Obtiene todas las obras con un estado específico
   *
   * @param {string} estado - Estado a filtrar (planificacion, en-curso, pausada, finalizada)
   * @returns {Promise<Obra[]>} Array de obras con el estado especificado
   * @throws {Error} Si hay un error en la consulta
   *
   * @example
   * const obrasFinalizadas = await obrasService.getByEstado("finalizada")
   */
  async getByEstado(estado: string) {
    const { data, error } = await supabase
      .from('obras')
      .select('*')
      .eq('estado', estado)
      .order('fecha_inicio', { ascending: false })

    if (error) throw error
    return data as Obra[]
  },

  /**
   * Método de conveniencia para obtener obras en progreso
   *
   * @returns {Promise<Obra[]>} Array de obras con estado "en-progreso"
   *
   * @example
   * const obrasActivas = await obrasService.getEnCurso()
   */
  async getEnCurso() {
    return this.getByEstado('en-progreso')
  },

  /**
   * Obtiene la obra actual de un trabajador (asignación activa)
   */
  async getObraActualTrabajador(trabajadorId: number): Promise<Obra | null> {
    const { data, error } = await supabase
      .from('trabajadores_obras')
      .select('obra_id, obras!inner(*)')
      .eq('trabajador_id', trabajadorId)
      .eq('activo', true)
      .limit(1)

    if (error || !data || data.length === 0) return null
    return (data[0] as any).obras as Obra
  },

  /**
   * Asigna un trabajador a una obra con un cargo específico
   *
   * Esta operación realiza tres acciones:
   * 1. Desactiva cualquier asignación activa anterior del trabajador (solo puede estar en UNA obra a la vez)
   * 2. Crea un registro en trabajadores_obras
   * 3. Si hubo cambio de obra, crea documento pendiente de anexo de obra
   *
   * @param {number} obraId - ID de la obra
   * @param {number} trabajadorId - ID del trabajador a asignar
   * @param {string} cargoEnObra - Cargo que desempeñará en la obra
   * @returns {Promise<AsignacionTrabajador & {hubo_cambio_obra?: boolean}>} Registro de asignación creado
   * @throws {Error} Si hay un error en la asignación o actualización
   *
   * @example
   * const asignacion = await obrasService.asignarTrabajador(
   *   123,  // ID obra
   *   456,  // ID trabajador
   *   "Maestro Albañil"
   * )
   */
  async asignarTrabajador(obraId: number, trabajadorId: number, cargoEnObra: string) {
    try {
      // Usar función RPC que maneja la desactivación e inserción en una transacción atómica
      // Esto evita problemas de race conditions y conflictos de constraint
      const { data, error } = await supabase
        .rpc('asignar_trabajador_a_obra', {
          p_trabajador_id: trabajadorId,
          p_obra_id: obraId,
          p_cargo_en_obra: cargoEnObra
        })

      if (error) {
        // Si es error de constraint única, lanzar mensaje amigable
        if (error.message?.includes('idx_trabajador_obra_activa_unica') ||
            error.code === '23505') {
          throw new Error('El trabajador ya está asignado a otra obra. Un trabajador solo puede estar en una obra a la vez.')
        }
        throw error
      }

      return data as AsignacionTrabajador
    } catch (error: any) {
      // Re-lanzar con mensaje amigable si es el error de constraint
      if (error.message?.includes('idx_trabajador_obra_activa_unica') ||
          error.code === '23505' ||
          error.message?.includes('ya está asignado')) {
        throw new Error('El trabajador ya está asignado a otra obra. Un trabajador solo puede estar en una obra a la vez.')
      }
      throw error
    }
  },

  /**
   * Retira un trabajador de una obra (marca como inactivo)
   *
   * No elimina el registro sino que lo marca como inactivo para mantener
   * el historial de asignaciones. Actualiza también el array de obras_asignadas
   * del trabajador.
   *
   * @param {number} obraId - ID de la obra
   * @param {number} trabajadorId - ID del trabajador a retirar
   * @returns {Promise<boolean>} true si el retiro fue exitoso
   * @throws {Error} Si hay un error en la actualización
   *
   * @example
   * await obrasService.retirarTrabajador(123, 456)
   */
  async retirarTrabajador(obraId: number, trabajadorId: number) {
    const { error } = await supabase
      .from('trabajadores_obras')
      .update({
        activo: false,
        fecha_retiro: new Date().toISOString()
      })
      .eq('obra_id', obraId)
      .eq('trabajador_id', trabajadorId)
      .eq('activo', true)

    if (error) throw error
    return true
  },

  /**
   * Obtiene todos los trabajadores actualmente asignados a una obra
   *
   * Utiliza join con la tabla trabajadores para obtener datos completos.
   * Solo retorna asignaciones activas (activo = true).
   *
   * @param {number} obraId - ID de la obra
   * @returns {Promise<any>} Array de asignaciones con datos del trabajador incluidos
   * @throws {Error} Si hay un error en la consulta
   *
   * @example
   * const trabajadoresObra = await obrasService.getTrabajadores(123)
   * trabajadoresObra.forEach(asig => {
   *   console.log(`${asig.trabajadores.nombre} - ${asig.cargo_en_obra}`)
   * })
   */
  async getTrabajadores(obraId: number) {
    const { data, error } = await supabase
      .from('trabajadores_obras')
      .select(`
        *,
        trabajadores (*)
      `)
      .eq('obra_id', obraId)
      .eq('activo', true)

    if (error) throw error
    return data
  },

  /**
   * Obtiene todas las obras en las que un trabajador está asignado
   *
   * Utiliza join con la tabla obras para obtener datos completos.
   * Solo retorna asignaciones activas (activo = true).
   *
   * @param {number} trabajadorId - ID del trabajador
   * @returns {Promise<any>} Array de asignaciones con datos de la obra incluidos
   * @throws {Error} Si hay un error en la consulta
   *
   * @example
   * const obrasDelTrabajador = await obrasService.getObrasByTrabajador(456)
   * obrasDelTrabajador.forEach(asig => {
   *   console.log(`${asig.obras.nombre} - ${asig.cargo_en_obra}`)
   * })
   */
  async getObrasByTrabajador(trabajadorId: number) {
    const { data, error } = await supabase
      .from('trabajadores_obras')
      .select(`
        *,
        obras (*)
      `)
      .eq('trabajador_id', trabajadorId)
      .eq('activo', true)

    if (error) throw error
    return data
  }
}