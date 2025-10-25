// src/services/contratos.ts

import { supabase } from '@/lib/supabase'

// =====================================================
// TIPOS
// =====================================================

export interface Contrato {
  id: number
  trabajador_id: number
  obra_id: number
  numero_contrato: string
  es_anexo: boolean
  contrato_padre_id?: number
  tipo_anexo?: 'extension' | 'cambio_obra' | 'cambio_remuneracion'
  tipo_contrato: 'indefinido' | 'plazo-fijo'
  fecha_inicio: string
  fecha_termino?: string
  duracion_valor?: number
  duracion_unidad?: 'dias' | 'semanas' | 'meses'
  ciudad_contrato: string
  cargo: string
  funciones?: string
  salario_base: number
  salario_palabras: string
  suple_quincenal: number
  suple_palabras: string
  jornada_tipo: 'estandar' | 'especial'
  jornada_detalle?: string
  afp?: string
  prevision?: string
  isapre?: string
  pdf_url?: string
  pdf_firmado_url?: string
  estado_firma: 'pendiente' | 'firmado'
  fecha_firma?: string
  generado_por?: number
  fecha_generacion: string
  activo: boolean
  fecha_inactivacion?: string
  motivo_inactivacion?: string
  created_at: string
  updated_at: string
}

export interface ContratoVigente extends Contrato {
  trabajador_nombre: string
  trabajador_rut: string
  obra_nombre: string
  obra_ubicacion: string
  estado_vigencia: 'INDEFINIDO' | 'VENCIDO' | 'POR_VENCER' | 'VIGENTE'
  dias_hasta_vencimiento?: number
}

export interface AlertaContrato {
  id: number
  numero_contrato: string
  trabajador_id: number
  trabajador_nombre: string
  trabajador_rut: string
  obra_id: number
  obra_nombre: string
  fecha_termino: string
  dias_restantes: number
  urgencia: 'VENCIDO' | 'VENCE_HOY' | 'POR_VENCER'
}

export interface Finiquito {
  id: number
  contrato_id: number
  trabajador_id: number
  numero_finiquito: string
  fecha_finiquito: string
  fecha_termino_relacion: string
  ultimo_dia_trabajado: string
  causal_termino: string
  articulo_codigo: string
  dias_trabajados?: number
  sueldo_proporcional: number
  vacaciones_proporcionales: number
  gratificacion_proporcional: number
  horas_extra: number
  otros_haberes: number
  total_haberes: number
  anticipos: number
  prestamos: number
  otros_descuentos: number
  total_descuentos: number
  indemnizacion_años_servicio: number
  indemnizacion_aviso_previo: number
  indemnizacion_voluntaria: number
  total_indemnizaciones: number
  total_finiquito: number
  pdf_url?: string
  pdf_firmado_url?: string
  estado_firma: 'pendiente' | 'firmado'
  fecha_firma?: string
  observaciones?: string
  generado_por?: number
  fecha_generacion: string
  created_at: string
  updated_at: string
}

export interface CrearContratoDTO {
  trabajador_id: number
  obra_id: number
  tipo_contrato: 'indefinido' | 'plazo-fijo'
  fecha_inicio: string
  fecha_termino?: string
  duracion_valor?: number
  duracion_unidad?: 'dias' | 'semanas' | 'meses'
  ciudad_contrato: string
  cargo: string
  funciones?: string
  salario_base: number
  jornada_tipo?: 'estandar' | 'especial'
  jornada_detalle?: string
  afp?: string
  prevision?: string
  isapre?: string
  generado_por?: number
}

export interface CrearAnexoExtensionDTO {
  contrato_padre_id: number
  nueva_fecha_termino: string
  generado_por?: number
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Calcula el suple quincenal (40% del salario, redondeado a múltiplo de 50.000)
 */
export function calcularSuple(salario: number): number {
  const suple = salario * 0.4
  return Math.round(suple / 50000) * 50000
}

/**
 * Convierte un número a palabras en español chileno
 */
export function numeroAPalabras(numero: number): string {
  const unidades = ['', 'Un', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve']
  const decenas = ['', '', 'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa']
  const especiales = ['Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve']
  const centenas = ['', 'Ciento', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos']
  
  if (numero === 0) return 'Cero Pesos'
  
  const millones = Math.floor(numero / 1000000)
  const miles = Math.floor((numero % 1000000) / 1000)
  const unidadesNum = Math.floor(numero % 1000)
  
  let resultado = ''
  
  // Millones
  if (millones > 0) {
    if (millones === 1) {
      resultado = 'Un Millón'
    } else {
      resultado = convertirGrupo(millones) + ' Millones'
    }
  }
  
  // Miles
  if (miles > 0) {
    if (resultado) resultado += ' '
    if (miles === 1) {
      resultado += 'Mil'
    } else {
      resultado += convertirGrupo(miles) + ' Mil'
    }
  }
  
  // Unidades
  if (unidadesNum > 0) {
    if (resultado) resultado += ' '
    resultado += convertirGrupo(unidadesNum)
  }
  
  function convertirGrupo(num: number): string {
    const c = Math.floor(num / 100)
    const d = Math.floor((num % 100) / 10)
    const u = num % 10
    
    let texto = ''
    
    if (c > 0) {
      if (num === 100) {
        texto = 'Cien'
      } else {
        texto = centenas[c]
      }
    }
    
    if (d === 1 && u > 0) {
      if (texto) texto += ' '
      texto += especiales[u]
    } else {
      if (d > 1) {
        if (texto) texto += ' '
        texto += decenas[d]
        if (u > 0) {
          texto += ' y ' + unidades[u]
        }
      } else if (u > 0) {
        if (texto) texto += ' '
        texto += unidades[u]
      }
    }
    
    return texto
  }
  
  return resultado + ' Pesos'
}

// =====================================================
// SERVICIO DE CONTRATOS
// =====================================================

export const contratosService = {
  /**
   * Obtener todos los contratos
   */
  async getAll(): Promise<Contrato[]> {
    const { data, error } = await supabase
      .from('contratos')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  /**
   * Obtener contrato por ID
   */
  async getById(id: number): Promise<Contrato> {
    const { data, error } = await supabase
      .from('contratos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Obtener contratos de un trabajador
   */
  async getByTrabajador(trabajadorId: number): Promise<Contrato[]> {
    const { data, error } = await supabase
      .from('contratos')
      .select('*')
      .eq('trabajador_id', trabajadorId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  /**
   * Obtener contratos de una obra
   */
  async getByObra(obraId: number): Promise<Contrato[]> {
    const { data, error } = await supabase
      .from('contratos')
      .select('*')
      .eq('obra_id', obraId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  /**
   * Obtener contratos vigentes
   */
  async getVigentes(): Promise<ContratoVigente[]> {
    const { data, error } = await supabase
      .from('contratos_vigentes')
      .select('*')
    
    if (error) throw error
    return data || []
  },

  /**
   * Obtener alertas de contratos por vencer
   */
  async getAlertas(): Promise<AlertaContrato[]> {
    const { data, error } = await supabase
      .from('alertas_contratos_vencer')
      .select('*')
    
    if (error) throw error
    return data || []
  },

  /**
   * Obtener alertas de contratos por vencer para un usuario específico
   * (Solo obras donde el usuario es profesional a cargo)
   */
  async getAlertasPorUsuario(usuarioId: number): Promise<AlertaContrato[]> {
    // Primero obtenemos las obras del usuario
    const { data: obrasUsuario, error: errorObras } = await supabase
      .from('trabajadores_obras')
      .select('obra_id')
      .eq('trabajador_id', usuarioId)
      .eq('activo', true)
    
    if (errorObras) throw errorObras
    
    const obrasIds = (obrasUsuario || []).map(a => a.obra_id)
    
    if (obrasIds.length === 0) return []
    
    // Luego las alertas de esas obras
    const { data, error } = await supabase
      .from('alertas_contratos_vencer')
      .select('*')
      .in('obra_id', obrasIds)
    
    if (error) throw error
    return data || []
  },

  /**
   * Crear contrato nuevo
   */
  async crear(dto: CrearContratoDTO): Promise<Contrato> {
    // Obtener datos del trabajador para RUT
    const { data: trabajador, error: errorTrabajador } = await supabase
      .from('trabajadores')
      .select('rut')
      .eq('id', dto.trabajador_id)
      .single()
    
    if (errorTrabajador) throw errorTrabajador
    
    // Generar número de contrato
    const { data: numeroData, error: errorNumero } = await supabase
      .rpc('generar_numero_contrato', {
        p_trabajador_id: dto.trabajador_id,
        p_rut: trabajador.rut
      })
    
    if (errorNumero) throw errorNumero
    
    // Calcular suple
    const suple = calcularSuple(dto.salario_base)
    
    const contrato: Partial<Contrato> = {
      trabajador_id: dto.trabajador_id,
      obra_id: dto.obra_id,
      numero_contrato: numeroData,
      es_anexo: false,
      tipo_contrato: dto.tipo_contrato,
      fecha_inicio: dto.fecha_inicio,
      fecha_termino: dto.fecha_termino,
      duracion_valor: dto.duracion_valor,
      duracion_unidad: dto.duracion_unidad,
      ciudad_contrato: dto.ciudad_contrato,
      cargo: dto.cargo,
      funciones: dto.funciones,
      salario_base: dto.salario_base,
      salario_palabras: numeroAPalabras(dto.salario_base),
      suple_quincenal: suple,
      suple_palabras: numeroAPalabras(suple),
      jornada_tipo: dto.jornada_tipo || 'estandar',
      jornada_detalle: dto.jornada_detalle,
      afp: dto.afp,
      prevision: dto.prevision,
      isapre: dto.isapre,
      generado_por: dto.generado_por,
      activo: true
    }
    
    const { data, error } = await supabase
      .from('contratos')
      .insert([contrato])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Crear anexo de extensión de plazo
   */
  async crearAnexoExtension(dto: CrearAnexoExtensionDTO): Promise<Contrato> {
    // Obtener contrato padre
    const { data: contratoPadre, error: errorPadre } = await supabase
      .from('contratos')
      .select('*')
      .eq('id', dto.contrato_padre_id)
      .single()
    
    if (errorPadre) throw errorPadre
    
    // Generar número de anexo
    const { data: numeroData, error: errorNumero } = await supabase
      .rpc('generar_numero_anexo', {
        p_contrato_padre_id: dto.contrato_padre_id
      })
    
    if (errorNumero) throw errorNumero
    
    // Crear anexo (copia datos del padre pero cambia fecha término)
    const anexo: Partial<Contrato> = {
      trabajador_id: contratoPadre.trabajador_id,
      obra_id: contratoPadre.obra_id,
      numero_contrato: numeroData,
      es_anexo: true,
      contrato_padre_id: dto.contrato_padre_id,
      tipo_anexo: 'extension',
      tipo_contrato: contratoPadre.tipo_contrato,
      fecha_inicio: contratoPadre.fecha_inicio,
      fecha_termino: dto.nueva_fecha_termino,
      ciudad_contrato: contratoPadre.ciudad_contrato,
      cargo: contratoPadre.cargo,
      funciones: contratoPadre.funciones,
      salario_base: contratoPadre.salario_base,
      salario_palabras: contratoPadre.salario_palabras,
      suple_quincenal: contratoPadre.suple_quincenal,
      suple_palabras: contratoPadre.suple_palabras,
      jornada_tipo: contratoPadre.jornada_tipo,
      jornada_detalle: contratoPadre.jornada_detalle,
      afp: contratoPadre.afp,
      prevision: contratoPadre.prevision,
      isapre: contratoPadre.isapre,
      generado_por: dto.generado_por,
      activo: true
    }
    
    const { data, error } = await supabase
      .from('contratos')
      .insert([anexo])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Actualizar contrato
   */
  async actualizar(id: number, updates: Partial<Contrato>): Promise<Contrato> {
    const { data, error } = await supabase
      .from('contratos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Marcar contrato como firmado
   */
  async marcarFirmado(id: number, pdfFirmadoUrl: string): Promise<Contrato> {
    const { data, error } = await supabase
      .from('contratos')
      .update({
        estado_firma: 'firmado',
        fecha_firma: new Date().toISOString().split('T')[0],
        pdf_firmado_url: pdfFirmadoUrl
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Inactivar contrato (cuando se hace finiquito)
   */
  async inactivar(id: number, motivo: string): Promise<Contrato> {
    const { data, error } = await supabase
      .from('contratos')
      .update({
        activo: false,
        fecha_inactivacion: new Date().toISOString(),
        motivo_inactivacion: motivo
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// =====================================================
// SERVICIO DE FINIQUITOS
// =====================================================

export const finiquitosService = {
  /**
   * Obtener todos los finiquitos
   */
  async getAll(): Promise<Finiquito[]> {
    const { data, error } = await supabase
      .from('finiquitos')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  /**
   * Obtener finiquito por ID
   */
  async getById(id: number): Promise<Finiquito> {
    const { data, error } = await supabase
      .from('finiquitos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Obtener finiquitos de un trabajador
   */
  async getByTrabajador(trabajadorId: number): Promise<Finiquito[]> {
    const { data, error } = await supabase
      .from('finiquitos')
      .select('*')
      .eq('trabajador_id', trabajadorId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  /**
   * Obtener finiquito de un contrato específico
   */
  async getByContrato(contratoId: number): Promise<Finiquito | null> {
    const { data, error } = await supabase
      .from('finiquitos')
      .select('*')
      .eq('contrato_id', contratoId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No encontrado
      throw error
    }
    return data
  }
}