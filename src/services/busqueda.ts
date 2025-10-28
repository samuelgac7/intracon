import { supabase } from '@/lib/supabase'

export interface ResultadoBusqueda {
  tipo: 'trabajador' | 'obra' | 'documento' | 'contrato'
  id: number
  titulo: string
  subtitulo?: string
  descripcion?: string
  link: string
  metadata?: Record<string, unknown>
}

export interface ResultadosBusqueda {
  trabajadores: ResultadoBusqueda[]
  obras: ResultadoBusqueda[]
  documentos: ResultadoBusqueda[]
  contratos: ResultadoBusqueda[]
  total: number
}

/**
 * Búsqueda global en toda la aplicación
 */
export async function buscarGlobal(
  query: string,
  limite: number = 20,
  usuarioId?: number,
  obrasAsignadas?: number[]
): Promise<ResultadosBusqueda> {
  if (!query || query.trim().length < 2) {
    return {
      trabajadores: [],
      obras: [],
      documentos: [],
      contratos: [],
      total: 0
    }
  }

  const queryLimpio = query.trim().toLowerCase()

  // Ejecutar búsquedas en paralelo
  const [trabajadores, obras, documentos, contratos] = await Promise.all([
    buscarTrabajadores(queryLimpio, limite, obrasAsignadas),
    buscarObras(queryLimpio, limite, obrasAsignadas),
    buscarDocumentos(queryLimpio, limite, obrasAsignadas),
    buscarContratos(queryLimpio, limite, obrasAsignadas)
  ])

  return {
    trabajadores,
    obras,
    documentos,
    contratos,
    total: trabajadores.length + obras.length + documentos.length + contratos.length
  }
}

/**
 * Buscar trabajadores por nombre, RUT o cargo
 */
async function buscarTrabajadores(
  query: string,
  limite: number,
  obrasAsignadas?: number[]
): Promise<ResultadoBusqueda[]> {
  try {
    let queryBuilder = supabase
      .from('trabajadores')
      .select('id, nombre, rut, cargo, estado, foto')
      .or(`nombre.ilike.%${query}%,rut.ilike.%${query}%,cargo.ilike.%${query}%`)
      .limit(limite)

    // Si hay obras asignadas, filtrar trabajadores de esas obras
    if (obrasAsignadas && obrasAsignadas.length > 0) {
      const { data: asignaciones } = await supabase
        .from('trabajadores_obras')
        .select('trabajador_id')
        .in('obra_id', obrasAsignadas)
        .eq('activo', true)

      const trabajadorIds = asignaciones?.map(a => a.trabajador_id) || []
      if (trabajadorIds.length > 0) {
        queryBuilder = queryBuilder.in('id', trabajadorIds)
      } else {
        return [] // No hay trabajadores en las obras asignadas
      }
    }

    const { data, error } = await queryBuilder

    if (error) throw error

    return (data || []).map(t => ({
      tipo: 'trabajador' as const,
      id: t.id,
      titulo: t.nombre,
      subtitulo: t.cargo,
      descripcion: `RUT: ${t.rut} • ${t.estado}`,
      link: `/trabajadores/${t.id}`,
      metadata: { foto: t.foto, estado: t.estado }
    }))
  } catch (error) {
    console.error('Error buscando trabajadores:', error)
    return []
  }
}

/**
 * Buscar obras por nombre, dirección o cliente
 */
async function buscarObras(
  query: string,
  limite: number,
  obrasAsignadas?: number[]
): Promise<ResultadoBusqueda[]> {
  try {
    let queryBuilder = supabase
      .from('obras')
      .select('id, nombre, direccion, cliente, estado, progreso')
      .or(`nombre.ilike.%${query}%,direccion.ilike.%${query}%,cliente.ilike.%${query}%`)
      .limit(limite)

    // Filtrar por obras asignadas si corresponde
    if (obrasAsignadas && obrasAsignadas.length > 0) {
      queryBuilder = queryBuilder.in('id', obrasAsignadas)
    }

    const { data, error } = await queryBuilder

    if (error) throw error

    return (data || []).map(o => ({
      tipo: 'obra' as const,
      id: o.id,
      titulo: o.nombre,
      subtitulo: o.cliente,
      descripcion: `${o.direccion} • ${o.estado} (${o.progreso}%)`,
      link: `/obras/${o.id}`,
      metadata: { estado: o.estado, progreso: o.progreso }
    }))
  } catch (error) {
    console.error('Error buscando obras:', error)
    return []
  }
}

/**
 * Buscar documentos por nombre o tipo
 */
async function buscarDocumentos(
  query: string,
  limite: number,
  obrasAsignadas?: number[]
): Promise<ResultadoBusqueda[]> {
  try {
    let queryBuilder = supabase
      .from('documentos_trabajador')
      .select(`
        id,
        nombre,
        tipo,
        estado_validacion,
        trabajador_id,
        trabajadores (nombre)
      `)
      .or(`nombre.ilike.%${query}%,tipo.ilike.%${query}%`)
      .limit(limite)

    // Si hay obras asignadas, filtrar documentos de trabajadores de esas obras
    if (obrasAsignadas && obrasAsignadas.length > 0) {
      const { data: asignaciones } = await supabase
        .from('trabajadores_obras')
        .select('trabajador_id')
        .in('obra_id', obrasAsignadas)
        .eq('activo', true)

      const trabajadorIds = asignaciones?.map(a => a.trabajador_id) || []
      if (trabajadorIds.length > 0) {
        queryBuilder = queryBuilder.in('trabajador_id', trabajadorIds)
      } else {
        return []
      }
    }

    const { data, error } = await queryBuilder

    if (error) throw error

    return (data || []).map(d => ({
      tipo: 'documento' as const,
      id: d.id,
      titulo: d.nombre,
      subtitulo: (d.trabajadores as any)?.nombre || 'Sin asignar',
      descripcion: `Tipo: ${d.tipo} • ${d.estado_validacion || 'pendiente'}`,
      link: `/trabajadores/${d.trabajador_id}#documentos`,
      metadata: { tipo: d.tipo, estado: d.estado_validacion }
    }))
  } catch (error) {
    console.error('Error buscando documentos:', error)
    return []
  }
}

/**
 * Buscar contratos por número o trabajador
 */
async function buscarContratos(
  query: string,
  limite: number,
  obrasAsignadas?: number[]
): Promise<ResultadoBusqueda[]> {
  try {
    let queryBuilder = supabase
      .from('contratos')
      .select(`
        id,
        numero_contrato,
        tipo_contrato,
        estado_firma,
        trabajador_id,
        trabajadores (nombre)
      `)
      .or(`numero_contrato.ilike.%${query}%`)
      .limit(limite)

    // Si hay obras asignadas, filtrar contratos de trabajadores de esas obras
    if (obrasAsignadas && obrasAsignadas.length > 0) {
      const { data: asignaciones } = await supabase
        .from('trabajadores_obras')
        .select('trabajador_id')
        .in('obra_id', obrasAsignadas)
        .eq('activo', true)

      const trabajadorIds = asignaciones?.map(a => a.trabajador_id) || []
      if (trabajadorIds.length > 0) {
        queryBuilder = queryBuilder.in('trabajador_id', trabajadorIds)
      } else {
        return []
      }
    }

    const { data, error } = await queryBuilder

    if (error) throw error

    return (data || []).map(c => ({
      tipo: 'contrato' as const,
      id: c.id,
      titulo: `Contrato ${c.numero_contrato}`,
      subtitulo: (c.trabajadores as any)?.nombre || 'Sin asignar',
      descripcion: `${c.tipo_contrato} • ${c.estado_firma}`,
      link: `/trabajadores/${c.trabajador_id}#contratos`,
      metadata: { tipo: c.tipo_contrato, estado: c.estado_firma }
    }))
  } catch (error) {
    console.error('Error buscando contratos:', error)
    return []
  }
}

/**
 * Guardar búsqueda reciente en localStorage
 */
export function guardarBusquedaReciente(query: string) {
  if (!query || query.trim().length < 2) return

  try {
    const recientes = obtenerBusquedasRecientes()
    const nuevasRecientes = [
      query.trim(),
      ...recientes.filter(q => q !== query.trim())
    ].slice(0, 5)

    localStorage.setItem('busquedas_recientes', JSON.stringify(nuevasRecientes))
  } catch (error) {
    console.error('Error guardando búsqueda reciente:', error)
  }
}

/**
 * Obtener búsquedas recientes desde localStorage
 */
export function obtenerBusquedasRecientes(): string[] {
  try {
    const recientes = localStorage.getItem('busquedas_recientes')
    return recientes ? JSON.parse(recientes) : []
  } catch (error) {
    console.error('Error obteniendo búsquedas recientes:', error)
    return []
  }
}

/**
 * Limpiar búsquedas recientes
 */
export function limpiarBusquedasRecientes() {
  try {
    localStorage.removeItem('busquedas_recientes')
  } catch (error) {
    console.error('Error limpiando búsquedas recientes:', error)
  }
}
