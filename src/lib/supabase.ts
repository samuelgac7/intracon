import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ==============================================================================
// TIPOS TYPESCRIPT PARA NUEVA ESTRUCTURA DE BD
// ==============================================================================

// Usuario: Personal CON acceso a intranet
export interface Usuario {
  id: number
  nombre: string
  rut: string
  email: string
  telefono?: string
  foto?: string
  cargo?: string
  fecha_ingreso: string
  activo: boolean
  rol: 'profesional' | 'visitador' | 'gerente' | 'super-admin'
  credenciales: {
    username: string
    passwordHash: string
    mustChangePassword: boolean
    ultimoAcceso?: string
    intentosFallidos: number
  }
  permisos: {
    trabajadores: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }
    obras: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }
    documentos: { ver: boolean; subir: boolean; eliminar: boolean }
    reportes: { ver: boolean; generar: boolean }
    configuracion: { ver: boolean; editar: boolean }
    finanzas: { ver: boolean; editar: boolean }
  }
  obras_asignadas?: number[] | null // null = todas las obras, [] = ninguna, [1,2,3] = específicas
  fecha_creacion?: string
  ultima_actualizacion?: string
}

// Trabajador: Personal de terreno SIN acceso a intranet
export interface Trabajador {
  id: number
  nombre: string
  rut: string
  email?: string
  telefono?: string
  direccion?: string
  comuna?: string
  region?: string
  foto?: string
  cargo: string
  fecha_ingreso: string
  salario: string
  tipo_contrato?: 'indefinido' | 'plazo-fijo' | 'obra' | 'honorarios'
  contrato?: string // Alias para tipo_contrato para compatibilidad
  tipo_jornada: 'completa' // Todos tienen jornada completa, horas extra se registran en asistencia
  afp?: string
  prevision?: 'fonasa' | 'isapre'
  isapre?: string
  banco?: string
  tipo_cuenta?: 'corriente' | 'vista' | 'rut'
  numero_cuenta?: string
  nacionalidad?: 'chilena' | 'extranjera'
  estado_civil?: 'soltero' | 'casado' | 'viudo' | 'divorciado'
  asignacion_colacion: number // Monto mensual de colación, se paga anticipadamente
  asignacion_movilizacion: number // Monto mensual de movilización, se paga anticipadamente
  nivel?: 'obrero' | 'tecnico' | 'profesional' | 'jefatura' | 'gerencia'
  estado: 'activo' | 'vacaciones' | 'licencia' | 'retirado'
  notas?: string
  fecha_creacion?: string
  ultima_actualizacion?: string
}

export interface Obra {
  id: number
  nombre: string
  codigo?: string
  tipo?: 'construccion' | 'remodelacion' | 'mantenimiento' | 'otro'
  cliente: string
  rut_cliente?: string
  direccion: string
  comuna: string
  region: string
  descripcion?: string
  foto?: string
  fecha_inicio: string
  fecha_termino_estimada?: string
  fecha_termino_real?: string
  monto_contrato?: number
  moneda?: string
  encargado_id?: number // FK a usuarios
  estado: 'planificacion' | 'en-progreso' | 'pausada' | 'terminada' | 'cancelada'
  progreso: number
  notas?: string
  fecha_creacion?: string
  ultima_actualizacion?: string
}

export interface TrabajadorObra {
  id: number
  trabajador_id: number
  obra_id: number
  cargo_en_obra: string
  fecha_asignacion: string
  fecha_retiro?: string
  activo: boolean
}

export interface Contrato {
  id: number
  trabajador_id: number
  obra_id?: number
  numero_contrato: string
  es_anexo: boolean
  contrato_padre_id?: number
  tipo_anexo?: string
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
  generado_por?: number // FK a usuarios
  fecha_generacion?: string
  activo: boolean
  fecha_inactivacion?: string
  motivo_inactivacion?: string
  created_at?: string
  updated_at?: string
}

export interface Finiquito {
  id: number
  contrato_id: number
  trabajador_id: number
  numero_finiquito: string
  fecha_finiquito: string
  causal_termino: string
  indemnizacion: number
  vacaciones_proporcionales: number
  otros_pagos: number
  total: number
  pdf_url?: string
  pdf_firmado_url?: string
  estado_firma: 'pendiente' | 'firmado'
  fecha_firma?: string
  generado_por?: number // FK a usuarios
  fecha_generacion?: string
  notas?: string
  created_at?: string
  updated_at?: string
}

export interface DocumentoTrabajador {
  id: number
  trabajador_id: number
  nombre: string
  tipo: 'contrato' | 'anexo_plazo' | 'anexo_obra' | 'finiquito' |
        'odi' | 'odi_cargo' | 'cedula_identidad' | 'entrega_epp' |
        'politica_acoso' | 'certificado_antecedentes' | 'entrega_ri' |
        'politica_ad' | 'politica_sso' | 'datos_personales' | 'otro'
  categoria?: 'prevencion' | 'administrativo'
  obligatorio?: boolean
  estado_validacion?: 'pendiente' | 'vigente' | 'por_vencer' | 'vencido' | 'rechazado'
  fecha_vencimiento?: string
  requiere_firma?: boolean
  firmado?: boolean
  fecha_firma?: string
  archivo: string
  fecha_subida: string
  tamanio?: number
  descripcion?: string
  subido_por?: number // FK a usuarios
  validado_por?: number // FK a usuarios que validó
  fecha_validacion?: string
  motivo_rechazo?: string
  fecha_creacion?: string
  ultima_actualizacion?: string
}

export interface DocumentoObligatorioConfig {
  id: number
  nombre: string
  codigo: string
  categoria: 'prevencion' | 'administrativo'
  descripcion?: string
  tiene_vencimiento: boolean
  dias_alerta_prevencimiento?: number
  requiere_firma: boolean
  aplica_todas_categorias: boolean
  categorias_trabajador?: string[]
  activo: boolean
  orden_visualizacion: number
  fecha_creacion?: string
  ultima_actualizacion?: string
}

export interface DocumentoObra {
  id: number
  obra_id: number
  nombre: string
  tipo?: string
  archivo: string
  fecha_subida: string
  tamanio?: number
  descripcion?: string
  subido_por?: number // FK a usuarios
}

export interface Evaluacion {
  id: number
  trabajador_id: number
  fecha: string
  tipo: 'desempeño' | 'seguridad' | 'tecnica'
  puntaje: number
  comentarios?: string
  evaluador_id?: number // FK a usuarios
}

export interface Bitacora {
  id: number
  obra_id: number
  fecha: string
  titulo: string
  descripcion: string
  clima?: 'soleado' | 'nublado' | 'lluvia' | 'viento'
  temperatura?: number
  trabajadores_presentes?: number
  fotos?: string[]
  autor_id?: number // FK a usuarios
}

export interface Gasto {
  id: number
  obra_id?: number
  fecha: string
  tipo: 'material' | 'mano-obra' | 'equipo' | 'subcontrato' | 'otro'
  categoria?: string
  descripcion: string
  monto: number
  moneda?: string
  proveedor?: string
  documento?: string
  registrado_por?: number // FK a usuarios
  fecha_registro?: string
}

export interface Material {
  id: number
  obra_id?: number
  nombre: string
  categoria?: string
  unidad: string
  cantidad_estimada?: number
  cantidad_utilizada?: number
  costo_unitario?: number
  moneda?: string
  proveedor?: string
  fecha_registro?: string
  registrado_por?: number // FK a usuarios
}

export interface Hito {
  id: number
  obra_id: number
  nombre: string
  descripcion?: string
  fecha_estimada: string
  fecha_completado?: string
  completado: boolean
  progreso: number
  notas?: string
  fecha_creacion?: string
}

export interface HistorialCambio {
  id: number
  trabajador_id?: number
  fecha: string
  tipo: 'estado' | 'cargo' | 'salario' | 'obra' | 'contrato' | 'otro'
  campo: string
  valor_anterior?: string
  valor_nuevo: string
  motivo?: string
  realizado_por?: number // FK a usuarios
}

export interface ContactoEmergencia {
  id: number
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
  es_contacto_principal: boolean
  orden_prioridad: number
  observaciones?: string
  activo: boolean
  created_at?: string
  updated_at?: string
}

export interface LogAuditoria {
  id: number
  usuario_id?: number
  fecha: string
  accion: string
  modulo: string
  descripcion?: string
  ip?: string
  user_agent?: string
  datos_adicionales?: Record<string, any>
}

export interface ConfiguracionEmpresa {
  id: number
  nombre: string
  rut: string
  direccion: string
  telefono: string
  email: string
  sitio_web: string
  logo?: string
  created_at?: string
  updated_at?: string
}

export interface ConfiguracionSeguridad {
  id: number
  intentos_maximos: number
  duracion_sesion: number
  cambio_password_obligatorio: boolean
  password_min_length: number
  password_requiere_numero: boolean
  password_requiere_mayuscula: boolean
  password_requiere_especial: boolean
  bloqueo_automatico: boolean
  notificaciones_email: boolean
  created_at?: string
  updated_at?: string
}

export interface ConfiguracionSistema {
  id: number
  modo_mantenimiento: boolean
  backup_automatico: boolean
  frecuencia_backup: string
  retencion_logs: number
  notificaciones_internas: boolean
  created_at?: string
  updated_at?: string
}
