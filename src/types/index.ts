// TRABAJADORES
export interface Trabajador {
  // IDENTIFICACIÓN
  id: number
  nombre: string
  rut: string
  
  // CARGO Y CLASIFICACIÓN
  nivel: 'obrero' | 'tecnico' | 'profesional' | 'jefatura' | 'gerencia'
  cargo: string
  especialidad?: string
  categoria?: 'A' | 'B' | 'C' | 'D' | 'E'
  
  // LABORAL
  departamento: string
  fechaIngreso: string
  salario: string
  contrato: 'indefinido' | 'plazo-fijo' | 'obra' | 'honorarios'
  tipoJornada?: 'completa' | 'parcial' | 'turno'
  
  // PREVISIÓN
  afp?: string
  prevision?: 'fonasa' | 'isapre'
  isapre?: string
  
  // CONTACTO
  email: string
  telefono: string
  direccion: string
  comuna?: string
  region?: string
  contactoEmergencia: string
  
  // ACCESO (SOLO TÉCNICO+)
  accesoIntranet: boolean
  credenciales?: {
    username: string
    passwordHash: string
    mustChangePassword: boolean
    ultimoAcceso?: string
    intentosFallidos: number
  }
  rol?: 'usuario' | 'supervisor' | 'administrador' | 'gerente' | 'super-admin'
  
  // DOCUMENTACIÓN (PARA CONTRATOS)
  nacionalidad?: 'chilena' | 'extranjera'
  estadoCivil?: 'soltero' | 'casado' | 'viudo' | 'divorciado'
  hijos?: number
  cargas?: number
  nivelEducacional?: 'basica' | 'media' | 'tecnica' | 'universitaria'
  
  // BANCARIO (PARA LIQUIDACIONES)
  banco?: string
  tipoCuenta?: 'corriente' | 'vista' | 'rut'
  numeroCuenta?: string
  
  // OBRA Y PROYECTO
  estado: 'activo' | 'vacaciones' | 'licencia' | 'retirado'
  obrasAsignadas: number[]
  
  // RECURSOS
  foto?: string
  documentos: DocumentoTrabajador[]
  evaluaciones: Evaluacion[]
  historialCambios: HistorialCambio[]
  
  // METADATA
  notas: string
  fechaCreacion?: string
  ultimaActualizacion?: string
}

export interface DocumentoTrabajador {
  id: number
  nombre: string
  tipo: 'contrato' | 'curriculum' | 'certificado' | 'licencia' | 'finiquito' | 'anexo' | 'otro'
  archivo: string
  fechaSubida: string
  tamaño: number
  descripcion?: string
}

export interface HistorialCambio {
  id: number
  fecha: string
  tipo: 'estado' | 'cargo' | 'salario' | 'departamento' | 'obra' | 'contrato' | 'otro'
  descripcion: string
  valorAnterior?: string
  valorNuevo?: string
  usuario?: string
}

export interface Evaluacion {
  id: number
  fecha: string
  tipo: 'desempeño' | 'seguridad' | 'tecnica'
  puntaje: number
  comentarios: string
  evaluador: string
}

// OBRAS
export interface Obra {
  id: number
  nombre: string
  ubicacion: string
  cliente: string
  fechaInicio: string
  fechaTermino?: string
  presupuesto: string
  estado: 'planificacion' | 'en-curso' | 'pausada' | 'finalizada'
  progreso: number
  descripcion?: string
  encargado?: number | null
  trabajadoresAsignados?: AsignacionTrabajador[]
  foto?: string
  documentos?: DocumentoObra[]
  gastos?: Gasto[]
  hitos?: Hito[]
  bitacora?: BitacoraEntrada[]
  materiales?: Material[]
}

export interface AsignacionTrabajador {
  trabajadorId: number
  cargoEnObra: string
  fechaAsignacion: string
  fechaRetiro?: string
  activo: boolean
}

export interface HistorialAsignacion {
  id: number
  trabajadorId: number
  obraId: number
  cargoEnObra: string
  fechaAsignacion: string
  fechaRetiro?: string
  motivo?: string
}

export interface DocumentoObra {
  id: number
  nombre: string
  tipo: 'plano' | 'contrato' | 'permiso' | 'certificado' | 'foto' | 'otro'
  archivo: string
  fechaSubida: string
  tamaño: number
}

export interface Gasto {
  id: number
  concepto: string
  monto: number
  fecha: string
  categoria: 'materiales' | 'mano-obra' | 'equipos' | 'servicios' | 'otros'
  comprobante?: string
}

export interface Hito {
  id: number
  nombre: string
  fechaPlanificada: string
  fechaReal?: string
  completado: boolean
  descripcion?: string
}

export interface BitacoraEntrada {
  id: number
  fecha: string
  titulo: string
  descripcion: string
  clima?: 'soleado' | 'nublado' | 'lluvia' | 'viento'
  temperatura?: number
  trabajadoresPresentes?: number
  autor: string
  fotos?: string[]
}

export interface Material {
  id: number
  nombre: string
  cantidad: number
  unidad: string
  stockMinimo: number
  ubicacion: string
}

// PERMISOS
export interface PermisosTrabajador {
  modulos: {
    dashboard: 'ninguno' | 'lectura' | 'completo'
    trabajadores: 'ninguno' | 'solo-yo' | 'lectura-todos' | 'gestion-completa'
    obras: 'ninguno' | 'solo-asignadas' | 'gestion-asignadas' | 'gestion-completa'
    finanzas: 'ninguno' | 'lectura' | 'gestion-completa'
    configuracion: 'ninguno' | 'basica' | 'avanzada'
  }
  obrasEspecificas?: number[]
}