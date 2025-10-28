import { supabase, type Trabajador } from '@/lib/supabase'
import { auditoriaService } from './auditoria'

/**
 * Servicio para la gestión de trabajadores (personal de terreno)
 *
 * Los trabajadores son personal de campo SIN acceso a la intranet.
 * Para gestión de usuarios con acceso, usar usuariosService.
 *
 * Proporciona operaciones CRUD para trabajadores y consultas filtradas
 * para el módulo de recursos humanos.
 *
 * @module trabajadoresService
 */
export const trabajadoresService = {
  /**
   * Obtiene todos los trabajadores del sistema ordenados alfabéticamente
   *
   * @returns {Promise<Trabajador[]>} Array de todos los trabajadores
   * @throws {Error} Si ocurre un error en la consulta a Supabase
   *
   * @example
   * const trabajadores = await trabajadoresService.getAll()
   * console.log(`Total de trabajadores: ${trabajadores.length}`)
   */
  async getAll() {
    // Usar el cliente de Supabase nativo es más rápido que fetch manual
    const { data, error } = await supabase
      .from('trabajadores')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) throw error
    return data as Trabajador[]
  },

  /**
   * Obtiene un trabajador específico por su ID
   *
   * @param {number} id - ID único del trabajador
   * @returns {Promise<Trabajador>} Datos completos del trabajador
   * @throws {Error} Si el trabajador no existe o hay un error en la consulta
   *
   * @example
   * const trabajador = await trabajadoresService.getById(123)
   * console.log(`Trabajador: ${trabajador.nombre}`)
   */
  async getById(id: number) {
    const { data, error } = await supabase
      .from('trabajadores')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Trabajador
  },


  /**
   * Crea un nuevo trabajador en el sistema
   *
   * IMPORTANTE: Los trabajadores NO tienen credenciales, rol ni permisos.
   * Solo son personal de terreno sobre los cuales se hace gestión documental.
   *
   * @param {Omit<Trabajador, 'id' | 'fecha_creacion' | 'ultima_actualizacion'>} trabajador - Datos del trabajador
   * @returns {Promise<Trabajador>} Trabajador creado con ID generado automáticamente
   * @throws {Error} Si hay un error en la inserción o validación de datos
   *
   * @example
   * const nuevoTrabajador = await trabajadoresService.create({
   *   nombre: "Juan Pérez",
   *   rut: "12345678-9",
   *   cargo: "Maestro",
   *   estado: "activo",
   *   fecha_ingreso: "2025-01-15",
   *   salario: "850000",
   *   asignacion_colacion: 0,
   *   asignacion_movilizacion: 0,
   *   tipo_jornada: "completa"
   * })
   */
  async create(trabajador: Omit<Trabajador, 'id' | 'fecha_creacion' | 'ultima_actualizacion'>) {
    const { data, error } = await supabase
      .from('trabajadores')
      .insert([trabajador])
      .select()
      .single()

    if (error) throw error
    return data as Trabajador
  },

  /**
   * Actualiza los datos de un trabajador existente
   *
   * @param {number} id - ID del trabajador a actualizar
   * @param {Partial<Trabajador>} updates - Campos a actualizar (solo los modificados)
   * @returns {Promise<Trabajador>} Trabajador actualizado con los nuevos valores
   * @throws {Error} Si el trabajador no existe o hay un error en la actualización
   *
   * @example
   * const actualizado = await trabajadoresService.update(123, {
   *   cargo: "Jefe de Obra",
   *   salario: "950000",
   *   asignacion_colacion: 250000
   * })
   */
  async update(id: number, updates: Partial<Trabajador>) {
    const { data, error } = await supabase
      .from('trabajadores')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Trabajador
  },

  /**
   * Elimina un trabajador del sistema
   *
   * PRECAUCIÓN: Esta operación es irreversible. Se recomienda cambiar el estado
   * a "retirado" en lugar de eliminar para mantener el historial.
   *
   * @param {number} id - ID del trabajador a eliminar
   * @returns {Promise<boolean>} true si la eliminación fue exitosa
   * @throws {Error} Si hay un error en la eliminación (ej: restricciones de FK)
   *
   * @example
   * await trabajadoresService.delete(123)
   */
  async delete(id: number) {
    const { error } = await supabase
      .from('trabajadores')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  /**
   * Filtra trabajadores por múltiples criterios
   *
   * Permite filtrar por estado, cargo y/o búsqueda de texto libre.
   * Los filtros son opcionales y se combinan con lógica AND.
   * La búsqueda de texto busca en nombre, RUT y cargo.
   *
   * @param {Object} filters - Objeto con criterios de filtrado
   * @param {string} [filters.estado] - Estado del trabajador (activo, vacaciones, licencia, retirado)
   * @param {string} [filters.cargo] - Cargo del trabajador
   * @param {string} [filters.search] - Término de búsqueda en nombre, RUT o cargo
   * @returns {Promise<Trabajador[]>} Array de trabajadores que cumplen los criterios
   * @throws {Error} Si hay un error en la consulta
   *
   * @example
   * const activos = await trabajadoresService.filter({ estado: "activo" })
   * const maestros = await trabajadoresService.filter({ cargo: "Maestro" })
   * const resultado = await trabajadoresService.filter({
   *   cargo: "Carpintero",
   *   estado: "activo",
   *   search: "Juan"
   * })
   */
  async filter(filters: {
    estado?: string
    cargo?: string
    search?: string
  }) {
    let query = supabase.from('trabajadores').select('*')

    if (filters.estado) {
      query = query.eq('estado', filters.estado)
    }

    if (filters.cargo) {
      query = query.eq('cargo', filters.cargo)
    }

    if (filters.search) {
      query = query.or(`nombre.ilike.%${filters.search}%,rut.ilike.%${filters.search}%,cargo.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order('nombre', { ascending: true })

    if (error) throw error
    return data as Trabajador[]
  },

  /**
   * Búsqueda full-text optimizada usando PostgreSQL tsvector
   *
   * Utiliza el índice GIN creado en search_vector para búsquedas rápidas
   * incluso con miles de trabajadores. Busca en nombre, RUT, cargo, teléfono y dirección.
   *
   * @param {string} searchTerm - Término de búsqueda (puede incluir múltiples palabras)
   * @param {Object} [options] - Opciones adicionales de filtrado
   * @param {string} [options.estado] - Filtrar por estado
   * @param {string} [options.cargo] - Filtrar por cargo
   * @param {number} [options.limit] - Límite de resultados (default: 50)
   * @returns {Promise<Trabajador[]>} Array de trabajadores ordenados por relevancia
   * @throws {Error} Si hay un error en la consulta
   *
   * @example
   * // Búsqueda simple
   * const resultados = await trabajadoresService.searchFullText("juan perez")
   *
   * // Búsqueda con filtros
   * const activos = await trabajadoresService.searchFullText("carpintero", {
   *   estado: "activo",
   *   limit: 20
   * })
   */
  async searchFullText(
    searchTerm: string,
    options?: {
      estado?: string
      cargo?: string
      limit?: number
    }
  ) {
    if (!searchTerm || searchTerm.trim() === '') {
      return this.getAll()
    }

    // Preparar término de búsqueda para tsquery
    // Reemplazar espacios por & para búsqueda AND
    const tsQuery = searchTerm
      .trim()
      .split(/\s+/)
      .map(word => `${word}:*`) // Agregar :* para búsqueda de prefijo
      .join(' & ')

    let query = supabase
      .from('trabajadores')
      .select('*')
      .textSearch('search_vector', tsQuery, {
        type: 'websearch',
        config: 'spanish'
      })

    if (options?.estado) {
      query = query.eq('estado', options.estado)
    }

    if (options?.cargo) {
      query = query.eq('cargo', options.cargo)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error en búsqueda full-text:', error)
      // Fallback a búsqueda tradicional si falla
      return this.filter({ search: searchTerm, ...options })
    }

    return data as Trabajador[]
  },


  /**
   * Obtiene todos los trabajadores con estado "activo"
   *
   * @returns {Promise<Trabajador[]>} Array de trabajadores activos
   * @throws {Error} Si hay un error en la consulta
   *
   * @example
   * const activos = await trabajadoresService.getActivos()
   * console.log(`Trabajadores activos: ${activos.length}`)
   */
  async getActivos() {
    const { data, error } = await supabase
      .from('trabajadores')
      .select('*')
      .eq('estado', 'activo')
      .order('nombre', { ascending: true })

    if (error) throw error
    return data as Trabajador[]
  },

}