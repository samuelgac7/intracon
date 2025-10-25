/**
 * Servicio para gestión de Contactos de Emergencia
 * Maneja operaciones CRUD para contactos de emergencia de trabajadores
 */

import { supabase } from '@/lib/supabase'

export interface ContactoEmergencia {
  id?: number
  trabajador_id: number
  nombre: string
  relacion:
    | 'conyuge'
    | 'pareja'
    | 'padre'
    | 'madre'
    | 'hijo'
    | 'hija'
    | 'hermano'
    | 'hermana'
    | 'abuelo'
    | 'abuela'
    | 'tio'
    | 'tia'
    | 'primo'
    | 'amigo'
    | 'otro'
  relacion_otra?: string
  telefono_principal: string
  telefono_secundario?: string
  email?: string
  direccion?: string
  comuna?: string
  es_contacto_principal?: boolean
  orden_prioridad?: number
  observaciones?: string
  activo?: boolean
  created_at?: string
  updated_at?: string
}

export interface ContactoEmergenciaConTrabajador extends ContactoEmergencia {
  trabajador_nombre: string
  trabajador_rut: string
  trabajador_cargo: string
}

export interface CreateContactoEmergenciaDTO {
  trabajador_id: number
  nombre: string
  relacion: ContactoEmergencia['relacion']
  relacion_otra?: string
  telefono_principal: string
  telefono_secundario?: string
  email?: string
  direccion?: string
  comuna?: string
  es_contacto_principal?: boolean
  orden_prioridad?: number
  observaciones?: string
}

export interface UpdateContactoEmergenciaDTO extends Partial<CreateContactoEmergenciaDTO> {
  activo?: boolean
}

/**
 * Servicio de Contactos de Emergencia
 */
export const contactosEmergenciaService = {
  /**
   * Obtener todos los contactos de emergencia de un trabajador
   */
  async getByTrabajador(trabajadorId: number): Promise<ContactoEmergencia[]> {
    const { data, error } = await supabase
      .from('contactos_emergencia')
      .select('*')
      .eq('trabajador_id', trabajadorId)
      .eq('activo', true)
      .order('es_contacto_principal', { ascending: false })
      .order('orden_prioridad', { ascending: true })

    if (error) {
      console.error('Error al obtener contactos de emergencia:', error)
      throw error
    }

    return data || []
  },

  /**
   * Obtener contacto principal de un trabajador
   */
  async getContactoPrincipal(trabajadorId: number): Promise<ContactoEmergencia | null> {
    const { data, error } = await supabase
      .from('contactos_emergencia')
      .select('*')
      .eq('trabajador_id', trabajadorId)
      .eq('es_contacto_principal', true)
      .eq('activo', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error al obtener contacto principal:', error)
      throw error
    }

    return data
  },

  /**
   * Obtener un contacto específico por ID
   */
  async getById(id: number): Promise<ContactoEmergencia | null> {
    const { data, error } = await supabase
      .from('contactos_emergencia')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error al obtener contacto:', error)
      throw error
    }

    return data
  },

  /**
   * Obtener todos los contactos con información del trabajador
   */
  async getAllWithTrabajador(): Promise<ContactoEmergenciaConTrabajador[]> {
    const { data, error } = await supabase
      .from('vista_contactos_emergencia')
      .select('*')
      .order('trabajador_nombre', { ascending: true })

    if (error) {
      console.error('Error al obtener contactos con trabajador:', error)
      throw error
    }

    return data || []
  },

  /**
   * Crear un nuevo contacto de emergencia
   */
  async create(dto: CreateContactoEmergenciaDTO): Promise<ContactoEmergencia> {
    // Validaciones básicas
    if (!dto.nombre || !dto.telefono_principal) {
      throw new Error('Nombre y teléfono principal son obligatorios')
    }

    if (dto.relacion === 'otro' && !dto.relacion_otra) {
      throw new Error('Debe especificar el tipo de relación cuando selecciona "otro"')
    }

    const { data, error } = await supabase
      .from('contactos_emergencia')
      .insert([dto])
      .select()
      .single()

    if (error) {
      console.error('Error al crear contacto de emergencia:', error)
      throw error
    }

    return data
  },

  /**
   * Actualizar un contacto de emergencia
   */
  async update(id: number, dto: UpdateContactoEmergenciaDTO): Promise<ContactoEmergencia> {
    if (dto.relacion === 'otro' && !dto.relacion_otra) {
      throw new Error('Debe especificar el tipo de relación cuando selecciona "otro"')
    }

    const { data, error } = await supabase
      .from('contactos_emergencia')
      .update(dto)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar contacto de emergencia:', error)
      throw error
    }

    return data
  },

  /**
   * Marcar contacto como principal (desmarca los demás automáticamente via trigger)
   */
  async marcarComoPrincipal(id: number, trabajadorId: number): Promise<void> {
    const { error } = await supabase
      .from('contactos_emergencia')
      .update({ es_contacto_principal: true })
      .eq('id', id)
      .eq('trabajador_id', trabajadorId)

    if (error) {
      console.error('Error al marcar contacto como principal:', error)
      throw error
    }
  },

  /**
   * Eliminar (inactivar) un contacto de emergencia
   */
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('contactos_emergencia')
      .update({ activo: false })
      .eq('id', id)

    if (error) {
      console.error('Error al eliminar contacto de emergencia:', error)
      throw error
    }
  },

  /**
   * Eliminar permanentemente un contacto (usar con precaución)
   */
  async deletePermanente(id: number): Promise<void> {
    const { error } = await supabase
      .from('contactos_emergencia')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error al eliminar permanentemente contacto:', error)
      throw error
    }
  },

  /**
   * Reordenar contactos (actualizar orden de prioridad)
   */
  async reordenar(trabajadorId: number, ordenContactos: { id: number; orden: number }[]): Promise<void> {
    const promesas = ordenContactos.map(({ id, orden }) =>
      supabase
        .from('contactos_emergencia')
        .update({ orden_prioridad: orden })
        .eq('id', id)
        .eq('trabajador_id', trabajadorId)
    )

    const resultados = await Promise.all(promesas)
    const errores = resultados.filter(r => r.error)

    if (errores.length > 0) {
      console.error('Error al reordenar contactos:', errores)
      throw new Error('Error al reordenar algunos contactos')
    }
  },

  /**
   * Verificar si un trabajador tiene al menos un contacto de emergencia
   */
  async tieneContactos(trabajadorId: number): Promise<boolean> {
    const { count, error } = await supabase
      .from('contactos_emergencia')
      .select('id', { count: 'exact', head: true })
      .eq('trabajador_id', trabajadorId)
      .eq('activo', true)

    if (error) {
      console.error('Error al verificar contactos:', error)
      throw error
    }

    return (count || 0) > 0
  },

  /**
   * Obtener estadísticas de contactos de emergencia
   */
  async getEstadisticas() {
    const { data: trabajadoresSinContacto, error: errorSinContacto } = await supabase.rpc(
      'trabajadores_sin_contacto_emergencia'
    )

    if (errorSinContacto && errorSinContacto.code !== '42883') {
      console.error('Error al obtener trabajadores sin contacto:', errorSinContacto)
    }

    const { count: totalContactos } = await supabase
      .from('contactos_emergencia')
      .select('id', { count: 'exact', head: true })
      .eq('activo', true)

    const { count: trabajadoresConContacto } = await supabase
      .from('contactos_emergencia')
      .select('trabajador_id', { count: 'exact', head: true })
      .eq('activo', true)

    return {
      totalContactos: totalContactos || 0,
      trabajadoresConContacto: trabajadoresConContacto || 0,
      trabajadoresSinContacto: trabajadoresSinContacto || 0
    }
  }
}

/**
 * Utilidades para formateo y validación
 */
export const contactosEmergenciaUtils = {
  /**
   * Formatear número telefónico chileno
   */
  formatearTelefono(telefono: string): string {
    // Eliminar caracteres no numéricos
    const numeros = telefono.replace(/\D/g, '')

    // Si tiene 9 dígitos (formato móvil chileno)
    if (numeros.length === 9) {
      return `+56 9 ${numeros.substring(1, 5)} ${numeros.substring(5)}`
    }

    // Si tiene 8 dígitos (formato fijo)
    if (numeros.length === 8) {
      return `+56 ${numeros.substring(0, 1)} ${numeros.substring(1, 5)} ${numeros.substring(5)}`
    }

    // Retornar sin formato si no coincide
    return telefono
  },

  /**
   * Validar formato de teléfono chileno
   */
  validarTelefono(telefono: string): boolean {
    const numeros = telefono.replace(/\D/g, '')
    // Móvil: 9 dígitos empezando con 9
    // Fijo: 8 dígitos
    return (numeros.length === 9 && numeros[0] === '9') || numeros.length === 8
  },

  /**
   * Obtener etiqueta legible de relación
   */
  getEtiquetaRelacion(relacion: ContactoEmergencia['relacion'], relacionOtra?: string): string {
    const etiquetas: Record<string, string> = {
      conyuge: 'Cónyuge',
      pareja: 'Pareja',
      padre: 'Padre',
      madre: 'Madre',
      hijo: 'Hijo',
      hija: 'Hija',
      hermano: 'Hermano',
      hermana: 'Hermana',
      abuelo: 'Abuelo',
      abuela: 'Abuela',
      tio: 'Tío',
      tia: 'Tía',
      primo: 'Primo/a',
      amigo: 'Amigo/a',
      otro: relacionOtra || 'Otro'
    }

    return etiquetas[relacion] || relacion
  },

  /**
   * Validar email
   */
  validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }
}

export default contactosEmergenciaService
